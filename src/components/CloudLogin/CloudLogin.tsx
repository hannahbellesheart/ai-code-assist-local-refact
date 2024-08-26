import { Button, Flex, Radio, RadioCards, Text } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { useLogin } from "../../hooks";
import { isGoodResponse } from "../../services/smallcloud";

export interface CloudLoginProps {
  goBack: () => void;
}

export const CloudLogin: React.FC<CloudLoginProps> = ({
  goBack,
}: CloudLoginProps) => {
  const [selected, setSelected] = useState<"free" | "pro">("free");
  const loginButton = useRef<HTMLButtonElement>(null);

  const { loginThroughWeb, cancelLogin, loginWithKey, polling } = useLogin();

  useEffect(() => {
    cancelLogin.current();
  }, [cancelLogin, selected]);

  useEffect(() => {
    const { current } = loginButton;
    if (current === null) {
      return;
    }

    if (polling.isLoading) {
      const loadingText = "Fetching API Key ";
      const animationFrames = ["/", "|", "\\", "-"];
      let index = 0;

      const interval = setInterval(() => {
        current.innerText = `${loadingText} ${animationFrames[index]}`;
        index = (index + 1) % animationFrames.length;
      }, 100);

      return () => {
        clearInterval(interval);
      };
    } else {
      current.innerText = "Login";
    }
  }, [loginButton, polling.isLoading]);

  useEffect(() => {
    if (isGoodResponse(polling.data)) {
      const apiKey = polling.data.secret_key;
      loginWithKey(apiKey);
    }
  }, [polling.data, loginWithKey]);

  const onValueChange = (value: string) => {
    setSelected(value as "free" | "pro");
  };

  const onLogin = () => {
    loginThroughWeb(selected === "pro");
  };

  return (
    <Flex direction="column" gap="2" maxWidth="540px" m="8px">
      <Button
        ref={loginButton}
        onClick={onLogin}
        style={{
          width: "100%",
          fontFamily: polling.isLoading ? "monospace" : undefined,
        }}
        disabled={polling.isLoading}
      >
        Login
      </Button>
      <Text weight="bold" size="3" align={"center"}>
        or Create New Account
      </Text>

      <RadioCards.Root
        style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        value={selected}
        onValueChange={onValueChange}
      >
        <RadioCards.Item
          value="free"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0,
          }}
        >
          <Flex gap="6px">
            <Radio value="free" checked={selected === "free"} />
            <Text size="3">Free plan</Text>
          </Flex>
          <Text size="2">- Code completions: Refact 1.6 model</Text>
          <Text size="2">- In-IDE Chat: GPT-4o mini</Text>
          <Text size="2">- Toolbox (refactor code, find bugs, etc.)</Text>
          <Text size="2">- 2048-context length for completions</Text>
          <Text size="2">- 8k context length for chat</Text>
        </RadioCards.Item>
        <RadioCards.Item
          value="pro"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0,
          }}
        >
          <Flex gap="6px">
            <Radio value="pro" checked={selected === "pro"} />
            <Text size="3">Pro plan</Text>
          </Flex>
          <Text size="2" mb="10px">
            As in the Free plan, plus:
          </Text>
          <Text size="2">+ Code completions: StarCode2-3B model</Text>
          <Text size="2">
            + In-IDE Chat: GPT-4o, GPT-4 turbo, Claude 3.5 Sonnet
          </Text>
          <Text size="2">+ More AI models for Toolbox</Text>
          <Text size="2">+ x2 context length for completions</Text>
          <Text size="2">+ x4 context length for chat</Text>
        </RadioCards.Item>
      </RadioCards.Root>
      <Flex gap="2">
        <Button variant="outline" mr="auto" onClick={goBack}>
          {"< Back"}
        </Button>
        <Button ml="auto" onClick={onLogin}>
          {"Create New Account"}
        </Button>
      </Flex>
    </Flex>
  );
};
