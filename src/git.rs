use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use tracing::error;
use git2::{Branch, DiffOptions, Oid, Repository, Signature, Status, StatusOptions};

#[derive(Serialize, Deserialize, Debug)]
pub struct FileChange {
    pub path: String,
    pub status: FileChangeStatus,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum FileChangeStatus {
    ADDED,
    MODIFIED,
    DELETED,
}
impl FileChangeStatus {
    pub fn initial(&self) -> char {
        match self {
            FileChangeStatus::ADDED => 'A',
            FileChangeStatus::MODIFIED => 'M',
            FileChangeStatus::DELETED => 'D',
        }
    }
}

pub fn git_ls_files(repository_path: &PathBuf) -> Option<Vec<PathBuf>> {
    let repository = Repository::open(repository_path)
        .map_err(|e| error!("Failed to open repository: {}", e)).ok()?;
    
    let mut status_options = StatusOptions::new();
    status_options
        .include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_unmodified(true)
        .exclude_submodules(false)
        .include_ignored(false)
        .recurse_ignored_dirs(false);

    let statuses = repository.statuses(Some(&mut status_options))
        .map_err(|e| error!("Failed to get statuses: {}", e)).ok()?;

    let mut files = Vec::new();
    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            files.push(repository_path.join(path));
        }
    }
    if !files.is_empty() { Some(files) } else { None }
}

/// Similar to git checkout -b <branch_name>
// pub fn create_or_checkout_to_branch<'repo>(repository: &'repo Repository, branch_name: &str) -> Result<Branch<'repo>, String> {
//     let branch = match repository.find_branch(branch_name, git2::BranchType::Local) {
//         Ok(branch) => branch,
//         Err(_) => {
//             let head_commit = repository.head()
//                 .and_then(|h| h.peel_to_commit())
//                 .map_err(|e| format!("Failed to get HEAD commit: {}", e))?;
//             repository.branch(branch_name, &head_commit, false)
//                 .map_err(|e| format!("Failed to create branch: {}", e))?
//         }
//     };

//     // Checkout to the branch
//     let object = repository.revparse_single(&("refs/heads/".to_owned() + branch_name))
//         .map_err(|e| format!("Failed to revparse single: {}", e))?;
//     repository.checkout_tree(&object, None)
//         .map_err(|e| format!("Failed to checkout tree: {}", e))?;
//     repository.set_head(&format!("refs/heads/{}", branch_name))
//       .map_err(|e| format!("Failed to set head: {}", e))?;

//     Ok(branch)
// }

pub fn stage_changes(repository: &Repository, file_changes: &Vec<FileChange>) -> Result<(), String> {
    let mut index = repository.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    
    for file_change in file_changes {
        match file_change.status {
            FileChangeStatus::ADDED | FileChangeStatus::MODIFIED => {
                index.add_path(std::path::Path::new(&file_change.path))
                    .map_err(|e| format!("Failed to add file to index: {}", e))?;
            },
            FileChangeStatus::DELETED => {
                index.remove_path(std::path::Path::new(&file_change.path))
                    .map_err(|e| format!("Failed to remove file from index: {}", e))?;
            },
        }
    }
    
    index.write()
        .map_err(|e| format!("Failed to write index: {}", e))?;
    
    Ok(())
}

pub fn get_file_changes(repository: &Repository, include_unstaged: bool) -> Result<Vec<FileChange>, String> {
    let mut result = Vec::new();

    let statuses = repository.statuses(None)
        .map_err(|e| format!("Failed to get statuses: {}", e))?;
    for entry in statuses.iter() {
        let status = entry.status();
        if status.contains(Status::INDEX_NEW) { 
            result.push(FileChange {status: FileChangeStatus::ADDED, path: entry.path().unwrap().to_string()}) 
        }
        if status.contains(Status::INDEX_MODIFIED) { 
            result.push(FileChange {status: FileChangeStatus::MODIFIED, path: entry.path().unwrap().to_string()}) 
        }
        if status.contains(Status::INDEX_DELETED) { 
            result.push(FileChange {status: FileChangeStatus::DELETED, path: entry.path().unwrap().to_string()}) 
        }
        if include_unstaged {
            if status.contains(Status::WT_NEW) { 
                result.push(FileChange {status: FileChangeStatus::ADDED, path: entry.path().unwrap().to_string()}) 
            }
            if status.contains(Status::WT_MODIFIED) { 
                result.push(FileChange {status: FileChangeStatus::MODIFIED, path: entry.path().unwrap().to_string()}) 
            }
            if status.contains(Status::WT_DELETED) { 
                result.push(FileChange {status: FileChangeStatus::DELETED, path: entry.path().unwrap().to_string()}) 
            }
        }
    }

    Ok(result)
}

pub fn get_configured_author_email_and_name(repository: &Repository) -> Result<(String, String), String> {
    let config = repository.config().map_err(|e| format!("Failed to get repository config: {}", e))?;
    let author_email = config.get_string("user.email")
       .map_err(|e| format!("Failed to get author email: {}", e))?;
    let author_name = config.get_string("user.name")
        .map_err(|e| format!("Failed to get author name: {}", e))?;
    Ok((author_email, author_name))
}

pub fn commit(repository: &Repository, branch: &Branch, message: &str, author_name: &str, author_email: &str) -> Result<Oid, String> {
    
    let mut index = repository.index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    let tree_id = index.write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repository.find_tree(tree_id)
        .map_err(|e| format!("Failed to find tree: {}", e))?;

    let signature = Signature::now(author_name, author_email)
        .map_err(|e| format!("Failed to create signature: {}", e))?;

    let branch_ref_name = branch.get().name()
        .ok_or_else(|| "Invalid branch name".to_string())?;

    let parent_commit = if let Some(target) = branch.get().target() {
        repository.find_commit(target)
            .map_err(|e| format!("Failed to find branch commit: {}", e))?
    } else {
        return Err("No parent commits found".to_string());
    };

    repository.commit(
        Some(branch_ref_name), &signature, &signature, message, &tree, &[&parent_commit]
    ).map_err(|e| format!("Failed to create commit: {}", e))
}

/// Similar to `git diff`, from specified file changes.
pub fn git_diff(repository: &Repository, file_changes: &Vec<FileChange>) -> Result<String, String> {
    let mut diff_options = DiffOptions::new();
    diff_options.include_untracked(true);
    diff_options.recurse_untracked_dirs(true);
    for file_change in file_changes {
        diff_options.pathspec(&file_change.path);
    }

    // Create a new temporary tree, with all changes staged
    let mut index = repository.index().map_err(|e| format!("Failed to get repository index: {}", e))?;
    for file_change in file_changes {
        index.add_path(std::path::Path::new(&file_change.path))
            .map_err(|e| format!("Failed to add file to index: {}", e))?;
    }
    let oid = index.write_tree().map_err(|e| format!("Failed to write tree: {}", e))?;
    let new_tree = repository.find_tree(oid).map_err(|e| format!("Failed to find tree: {}", e))?;

    let head = repository.head().and_then(|head_ref| head_ref.peel_to_tree())
        .map_err(|e| format!("Failed to get HEAD tree: {}", e))?;

    let diff = repository.diff_tree_to_tree(Some(&head), Some(&new_tree), Some(&mut diff_options))
        .map_err(|e| format!("Failed to generate diff: {}", e))?;

    let mut diff_str = String::new();
    diff.print(git2::DiffFormat::Patch, |_, _, line| {
        diff_str.push(line.origin());
        diff_str.push_str(std::str::from_utf8(line.content()).unwrap_or(""));
        true
    }).map_err(|e| format!("Failed to print diff: {}", e))?;

    Ok(diff_str)
}
