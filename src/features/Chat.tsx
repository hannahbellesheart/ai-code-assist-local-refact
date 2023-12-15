import React from "react";
import { ChatForm } from "../components/ChatForm";
import { useEventBusForChat } from "../hooks/useEventBusForChat";
import { ChatContent } from "../components/ChatContent";
import { Flex } from "@radix-ui/themes";

export const Chat: React.FC = () => {
  const { state, askQuestion } = useEventBusForChat();

  return (
    <Flex
      direction="column"
      justify="between"
      grow="1"
      style={{
        height: "calc(100dvh - 180px)", // TODO: fix this
      }}
    >
      <ChatContent messages={state.chat.messages} />
      <ChatForm
        onSubmit={(value) => {

          askQuestion(value);
        }}
      />
    </Flex>
  );
};
