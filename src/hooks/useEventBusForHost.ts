import { useEffect } from "react";
import { sendChat } from "../services/refact";
import { useChatHistory } from "./useChatHistory";
import {
  EVENT_NAMES_TO_CHAT,
  ChatThread,
  isQuestionFromChat,
  isSaveChatFromChat,
} from "../events";

export function useEventBusForHost() {
  const { saveChat } = useChatHistory();

  useEffect(() => {
    const controller = new AbortController();
    const listener = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }

      if (isQuestionFromChat(event.data)) {
        const payload = event.data.payload;

        saveChat({
          id: payload.id,
          title: payload.title ?? "",
          messages: payload.messages,
          model: payload.model || "gpt-3.5-turbo",
        });

        handleSend(event.data.payload, controller);
        return;
      }

      if (isSaveChatFromChat(event.data)) {
        const chat = event.data.payload;
        saveChat(chat);
      }
    };

    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, [saveChat]);
}

function handleSend(chat: ChatThread, controller: AbortController) {
  sendChat(chat.messages, "gpt-3.5-turbo", controller)
    .then((response) => {
      const decoder = new TextDecoder();
      const reader = response.body?.getReader();
      if (!reader) return;
      void reader.read().then(function pump({ done, value }): Promise<void> {
        if (done) {
          // Do something with last chunk of data then exit reader
          return Promise.resolve();
        }

        const streamAsString = decoder.decode(value);

        const deltas = streamAsString
          .split("\n\n")
          .filter((str) => str.length > 0);
        if (deltas.length === 0) return Promise.resolve();

        for (const delta of deltas) {
          if (!delta.startsWith("data: ")) {
            console.log("Unexpected data in streaming buf: " + delta);
            continue;
          }

          const maybeJsonString = delta.substring(6);
          if (maybeJsonString === "[DONE]") {
            window.postMessage(
              { type: EVENT_NAMES_TO_CHAT.DONE_STREAMING },
              "*",
            );
            return Promise.resolve(); // handle finish
          }

          if (maybeJsonString === "[ERROR]") {
            console.log("Streaming error");
            // TODO safely parse json
            const errorJson = JSON.parse(maybeJsonString) as Record<
              string,
              unknown
            >;
            return Promise.reject(errorJson.detail ?? "streaming error"); // handle error
          }
          // figure out how to safely parseJson

          const json = JSON.parse(maybeJsonString) as Record<string, unknown>;
          window.postMessage(
            {
              type: EVENT_NAMES_TO_CHAT.CHAT_RESPONSE,
              payload: {
                id: chat.id,
                ...json,
              },
            },
            "*",
          );
        }

        return reader.read().then(pump);
      });
    })
    .catch((error: Error) => {
      console.error(error);
      window.postMessage(
        { type: EVENT_NAMES_TO_CHAT.ERROR_STREAMING, payload: error.message },
        "*",
      );
    })
    .finally(() => {
      window.postMessage({ type: EVENT_NAMES_TO_CHAT.DONE_STREAMING }, "*");
    });
}
