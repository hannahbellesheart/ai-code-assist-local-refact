import { Button, Flex, Text, TextField } from "@radix-ui/themes";
import { Checkbox } from "../Checkbox";
import { useEffect, useRef, useState } from "react";
import { useLogin, isGoodResponse } from "../../services/smallcloud";

export interface CloudLoginProps {
  goBack: () => void;
  next: (apiKey: string, sendCorrectedCodeSnippets: boolean) => void;
  openExternal: (url: string) => void;
}

export const CloudLogin: React.FC<CloudLoginProps> = ({
  goBack,
  next,
  // openExternal,
}: CloudLoginProps) => {
  const [sendCorrectedCodeSnippets, setSendCorrectedCodeSnippets] =
    useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState(false);
  const interval = useRef<NodeJS.Timeout | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);

  const { loginThroughWeb, loginWithKey, polling } = useLogin();

  useEffect(() => {
    setError(false);
    if (interval.current) {
      interval.current = undefined;
    }
  }, [apiKey]);

  useEffect(() => {
    const { current } = input;
    if (current === null || !error) {
      return;
    }
    current.focus();
  }, [error]);

  useEffect(() => {
    const { current } = input;
    if (current === null) {
      return;
    }

    if (polling.isFetching) {
      const loadingText = "Fetching API Key ";
      const animationFrames = ["/", "|", "\\", "-"];
      let index = 0;

      const interval = setInterval(() => {
        current.placeholder = `${loadingText} ${animationFrames[index]}`;
        index = (index + 1) % animationFrames.length;
      }, 100);

      return () => {
        clearInterval(interval);
      };
    } else {
      current.placeholder = "";
    }
  }, [input, polling.isFetching]);

  const canSubmit = Boolean(apiKey);
  const onSubmit = () => {
    if (!canSubmit) {
      setError(true);
      return;
    }
    loginWithKey(apiKey);
    // TODO: validate the key with user.data
    next(apiKey, sendCorrectedCodeSnippets);
  };

  useEffect(() => {
    if (polling.error) {
      setError(true);
    }
  }, [polling.error]);

  useEffect(() => {
    if (isGoodResponse(polling.data)) {
      setApiKey(polling.data.secret_key);
    }
  }, [polling.data]);

  return (
    <Flex direction="column" gap="2" maxWidth="540px" m="8px">
      <Text weight="bold" size="4">
        Cloud inference
      </Text>
      <Text size="2">Quick login via website:</Text>
      <Button onClick={loginThroughWeb}>Login / Create Account</Button>
      <Text size="2" mt="2">
        Alternatively, paste an existing Refact API key here:
      </Text>
      <TextField.Root
        ref={input}
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        color={error ? "red" : undefined}
        onBlur={() => setError(false)}
      />
      {error && (
        <Text size="2" color="red">
          Please Login / Create Account or enter API key
        </Text>
      )}
      <Text size="2" mt="4">
        Help Refact collect a dataset of corrected code completions! This will
        help to improve code suggestions more to your preferences, and it also
        will improve code suggestions for everyone else. Hey, we&#39;re not an
        evil corporation!
      </Text>
      <Checkbox
        checked={sendCorrectedCodeSnippets}
        onCheckedChange={(value) =>
          setSendCorrectedCodeSnippets(Boolean(value))
        }
      >
        Send corrected code snippets.
      </Checkbox>
      <Text size="2">
        Basic telemetry is always on when using cloud inference, but it only
        sends errors and counters.{" "}
        <a href="https://github.com/smallcloudai/refact-lsp/blob/main/README.md#telemetry">
          How telemetry works in open source refact-lsp
        </a>
      </Text>
      <Flex gap="2">
        <Button variant="outline" mr="auto" onClick={goBack}>
          {"< Back"}
        </Button>
        <Button variant="outline" ml="auto" type="submit" onClick={onSubmit}>
          {"Next >"}
        </Button>
      </Flex>
    </Flex>
  );
};
