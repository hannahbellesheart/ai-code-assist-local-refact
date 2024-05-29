use std::collections::HashMap;
use std::sync::Arc;
use serde_json::Value;

use async_trait::async_trait;
use tokio::sync::Mutex as AMutex;

use crate::at_commands::at_commands::AtCommandsContext;
use crate::call_validation::ContextEnum;

use crate::at_tools::att_workspace::AttWorkspace;
use crate::at_tools::att_file::AttFile;
use crate::at_tools::att_ast_definition::AttAstDefinition;
use crate::at_tools::att_ast_reference::AttAstReference;
use crate::at_tools::att_ast_lookup_symbols::AttAstLookupSymbols;


#[async_trait]
pub trait AtTool: Send + Sync {
    async fn execute(&self, ccx: &mut AtCommandsContext, tool_call_id: &String, args: &HashMap<String, Value>) -> Result<Vec<ContextEnum>, String>;
    fn depends_on(&self) -> Vec<String> { vec![] }   // "ast", "vecdb"
}

pub async fn at_tools_dict() -> HashMap<String, Arc<AMutex<Box<dyn AtTool + Send>>>> {
    return HashMap::from([
        ("workspace".to_string(), Arc::new(AMutex::new(Box::new(AttWorkspace{}) as Box<dyn AtTool + Send>))),
        ("file".to_string(), Arc::new(AMutex::new(Box::new(AttFile{}) as Box<dyn AtTool + Send>))),
        ("definition".to_string(), Arc::new(AMutex::new(Box::new(AttAstDefinition{}) as Box<dyn AtTool + Send>))),
        ("reference".to_string(), Arc::new(AMutex::new(Box::new(AttAstReference{}) as Box<dyn AtTool + Send>))),
        ("symbols-at".to_string(), Arc::new(AMutex::new(Box::new(AttAstLookupSymbols{}) as Box<dyn AtTool + Send>))),
        // ast-file-symbols?
        // local-notes-to-self
    ]);
}
