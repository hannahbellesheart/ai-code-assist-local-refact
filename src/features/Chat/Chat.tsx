import React from "react";
import type { Config } from "../Config/configSlice";
import { SystemPrompts } from "../../services/refact";
import { Chat as ChatComponent } from "../../components/Chat";
import {
  useGetCapsQuery,
  useGetPromptsQuery,
  useGetCommandCompletionQuery,
  useGetCommandPreviewQuery,
} from "../../app/hooks";
import { useDebounceCallback } from "usehooks-ts";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  getSelectedSystemPrompt,
  setSystemPrompt,
  selectMessages,
} from "./chatThread";

export type ChatProps = {
  host: Config["host"];
  tabbed: Config["tabbed"];
  style?: React.CSSProperties;
  backFromChat: () => void;
};

export const Chat: React.FC<ChatProps> = ({
  style,
  // askQuestion,
  // clearError,
  // setChatModel,
  // stopStreaming,
  backFromChat,
  // openChatInNewTab,
  // sendToSideBar,
  // handleNewFileClick,
  // handlePasteDiffClick,
  // hasContextFile,
  // requestCommandsCompletion,
  // requestPreviewFiles,
  // setSelectedCommand,
  // removePreviewFileByName,
  // retryQuestion,
  // maybeRequestCaps,
  // startNewChat,
  // setSelectedSystemPrompt,
  // setUseTools,
  // enableSend,
  // openSettings,
  host,
  tabbed,
  // state,
}) => {
  const capsRequest = useGetCapsQuery();

  // TODO: these could be lower in the component tree
  const promptsRequest = useGetPromptsQuery();
  const selectedSystemPrompt = useAppSelector(getSelectedSystemPrompt);
  const dispatch = useAppDispatch();
  const onSetSelectedSystemPrompt = (prompt: SystemPrompts) =>
    dispatch(setSystemPrompt(prompt));

  const messages = useAppSelector(selectMessages);

  // const chatRequest = useSendChatRequest();

  // commands should be a selector, and calling the hook ?
  const [command, setCommand] = React.useState<{
    query: string;
    cursor: number;
  }>({ query: "", cursor: 0 });

  // TODO: this could be put lower in the component tree to prevent re-renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requestCommandsCompletion = React.useCallback(
    useDebounceCallback(
      (query: string, cursor: number) => {
        setCommand({ query, cursor });
      },
      500,
      { leading: true, maxWait: 250 },
    ),
    [setCommand],
  );

  const commandResult = useGetCommandCompletionQuery(
    command.query,
    command.cursor,
  );

  const commandPreview = useGetCommandPreviewQuery(command.query);

  const sendToSideBar = () => {
    // TODO:
  };

  // const onSetSelectedSystemPrompt = useCallback(
  //   (key: string) => {
  //     if (!promptsRequest.data) return;
  //     if (!(key in promptsRequest.data)) return;
  //     if (key === "default") {
  //       setSelectedSystemPrompt("");
  //     } else {
  //       setSelectedSystemPrompt(key);
  //     }
  //   },
  //   [promptsRequest.data, setSelectedSystemPrompt],
  // );

  const maybeSendToSideBar =
    host === "vscode" && tabbed ? sendToSideBar : undefined;

  // can be a selector
  const unCalledTools = React.useMemo(() => {
    if (messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return false;
    const maybeTools = last.tool_calls;
    if (maybeTools && maybeTools.length > 0) return true;
    return false;
  }, [messages]);

  return (
    <ChatComponent
      style={style}
      host={host}
      tabbed={tabbed}
      backFromChat={backFromChat}
      // openChatInNewTab={openChatInNewTab}
      // onStopStreaming={stopStreaming}
      // chat={state.chat}
      // error={state.error}
      // onClearError={clearError}
      // retryQuestion={retryQuestion}
      // isWaiting={state.waiting_for_response}
      // isStreaming={state.streaming}
      // onNewFileClick={handleNewFileClick}
      // onPasteClick={handlePasteDiffClick}
      // canPaste={state.active_file.can_paste}
      // preventSend={state.prevent_send}
      unCalledTools={unCalledTools}
      // enableSend={enableSend}
      // onAskQuestion={(question: string) =>
      //   askQuestion(question, promptsRequest.data, toolsRequest.data)
      // }
      // TODO: This could be moved lower in the component tree
      caps={{
        error: capsRequest.error ? "error fetching caps" : null,
        fetching: capsRequest.isFetching,
        default_cap: capsRequest.data?.code_chat_default_model ?? "",
        available_caps: capsRequest.data?.code_chat_models ?? {},
      }}
      commands={commandResult}
      // is this used anywhere?
      // hasContextFile={hasContextFile}
      requestCommandsCompletion={requestCommandsCompletion}
      maybeSendToSidebar={maybeSendToSideBar}
      // activeFile={state.active_file}
      filesInPreview={commandPreview}
      // selectedSnippet={state.selected_snippet}
      // removePreviewFileByName={removePreviewFileByName}
      // requestCaps={() => {
      //   console.log("requestCaps called");
      //   void capsRequest.refetch();
      // }}
      prompts={promptsRequest.data ?? {}}
      // onStartNewChat={startNewChat}
      // Could be lowered
      onSetSystemPrompt={onSetSelectedSystemPrompt}
      selectedSystemPrompt={selectedSystemPrompt}
      requestPreviewFiles={() => ({})}
      // openSettings={openSettings}
    />
  );
};
