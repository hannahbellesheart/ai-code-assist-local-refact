import React, { forwardRef, useCallback, useMemo } from "react";
import { IconButton, Button, Flex, Text, HoverCard } from "@radix-ui/themes";
import {
  PaperPlaneIcon,
  ExitIcon,
  Cross1Icon,
  FileTextIcon,
} from "@radix-ui/react-icons";
import classNames from "classnames";
import styles from "./button.module.css";
import { useOpenUrl } from "../../hooks/useOpenUrl";
import { useAppDispatch, useAppSelector, useCapsForToolUse } from "../../hooks";
import { selectApiKey } from "../../features/Config/configSlice";
import { PuzzleIcon } from "../../images/PuzzleIcon";
import {
  selectThreadBoostReasoning,
  selectMessages,
  setBoostReasoning,
  selectChatId,
} from "../../features/Chat";

type IconButtonProps = React.ComponentProps<typeof IconButton>;
type ButtonProps = React.ComponentProps<typeof Button>;

export const PaperPlaneButton: React.FC<IconButtonProps> = (props) => (
  <IconButton variant="ghost" {...props}>
    <PaperPlaneIcon />
  </IconButton>
);
export const AgentIntegrationsButton = forwardRef<
  HTMLButtonElement,
  IconButtonProps
>((props, ref) => (
  <IconButton variant="ghost" {...props} ref={ref}>
    <PuzzleIcon />
  </IconButton>
));

AgentIntegrationsButton.displayName = "AgentIntegrationsButton";

export const ThreadHistoryButton: React.FC<IconButtonProps> = (props) => (
  <IconButton variant="ghost" {...props}>
    <FileTextIcon />
  </IconButton>
);

export const BackToSideBarButton: React.FC<IconButtonProps> = (props) => (
  <IconButton variant="ghost" {...props}>
    <ExitIcon style={{ transform: "scaleX(-1)" }} />
  </IconButton>
);

export const CloseButton: React.FC<
  IconButtonProps & { iconSize?: number | string }
> = ({ iconSize, ...props }) => (
  <IconButton variant="ghost" {...props}>
    <Cross1Icon width={iconSize} height={iconSize} />
  </IconButton>
);

export const RightButton: React.FC<ButtonProps & { className?: string }> = (
  props,
) => {
  return (
    <Button
      size="1"
      variant="surface"
      {...props}
      className={classNames(styles.rightButton, props.className)}
    />
  );
};

type FlexProps = React.ComponentProps<typeof Flex>;

export const RightButtonGroup: React.FC<React.PropsWithChildren & FlexProps> = (
  props,
) => {
  return (
    <Flex
      {...props}
      gap="1"
      className={classNames(styles.rightButtonGroup, props.className)}
    />
  );
};

type AgentUsageLinkButtonProps = ButtonProps & {
  href?: string;
  onClick?: () => void;
  target?: HTMLFormElement["target"];
  isPlanFree?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
};

const SUBSCRIPTION_URL =
  "https://refact.smallcloud.ai/refact/update-subscription";

const SUBSCRIPTION_FALLBACK_URL = "https://refact.smallcloud.ai/";

export const AgentUsageLinkButton: React.FC<AgentUsageLinkButtonProps> = ({
  href,
  isPlanFree,
  children,
  onClick,
  disabled,
  ...rest
}) => {
  const openUrl = useOpenUrl();
  const apiKey = useAppSelector(selectApiKey);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSubscriptionUrl = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(SUBSCRIPTION_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        openUrl(SUBSCRIPTION_FALLBACK_URL);
        return null;
      }

      const data = (await response.json()) as { url: string };
      return data.url;
    } catch (e) {
      openUrl(SUBSCRIPTION_FALLBACK_URL);
      return null;
    }
  }, [apiKey, openUrl]);

  const handleClick = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (isLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        if (href && isPlanFree) {
          openUrl(href);
        } else if (isPlanFree !== undefined && !isPlanFree) {
          const url = await fetchSubscriptionUrl();
          if (url) {
            openUrl(url);
          }
        }

        onClick?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in LinkButton:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [href, isPlanFree, onClick, openUrl, fetchSubscriptionUrl, isLoading],
  );

  return (
    <form onSubmit={(event) => void handleClick(event)}>
      <Button type="submit" disabled={disabled ?? isLoading} {...rest}>
        {isLoading ? "Loading..." : children}
      </Button>
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
};

export const ThinkingButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const chatId = useAppSelector(selectChatId);
  const messages = useAppSelector(selectMessages);
  const isBoostReasoningEnabled = useAppSelector(selectThreadBoostReasoning);
  const caps = useCapsForToolUse();

  const supportsBoostReasoning = useMemo(() => {
    const models = caps.data?.code_chat_models;
    const item = models?.[caps.currentModel];
    return item?.supports_boost_reasoning ?? false;
  }, [caps.data?.code_chat_models, caps.currentModel]);

  const shouldBeDisabled = useMemo(() => {
    return !supportsBoostReasoning || messages.length > 0;
  }, [supportsBoostReasoning, messages]);

  const handleReasoningChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, checked: boolean) => {
      event.stopPropagation();
      event.preventDefault();
      dispatch(setBoostReasoning({ chatId, value: checked }));
    },
    [dispatch, chatId],
  );

  return (
    <Flex gap="2" align="center">
      <HoverCard.Root>
        <HoverCard.Trigger>
          <Button
            size="1"
            onClick={(event) =>
              handleReasoningChange(event, !isBoostReasoningEnabled)
            }
            variant={isBoostReasoningEnabled ? "solid" : "outline"}
            disabled={shouldBeDisabled}
          >
            💡 Think
          </Button>
        </HoverCard.Trigger>
        <HoverCard.Content size="2" maxWidth="280px" side="top">
          <Text as="p" size="2">
            When enabled, the model will use enhanced reasoning capabilities
            which may improve problem-solving for complex tasks.
          </Text>
          {shouldBeDisabled && (
            <>
              <Text as="p" color="gray" size="1" mt="1">
                {!supportsBoostReasoning
                  ? `Note: ${caps.currentModel} doesn't support thinking`
                  : "Note: thinking cannot be disabled for already started conversation"}
              </Text>
            </>
          )}
        </HoverCard.Content>
      </HoverCard.Root>
    </Flex>
  );
};
