import { Button, Flex, Heading, IconButton } from "@radix-ui/themes";
import { useWindowDimensions } from "../../hooks/useWindowDimensions";
import type { FC } from "react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import styles from "./IntegrationsHeader.module.css";
import { LeftRightPadding } from "../../features/Integrations/Integrations";
import { toPascalCase } from "../../utils/toPascalCase";

type IntegrationsHeaderProps = {
  handleFormReturn: () => void;
  integrationName: string;
  leftRightPadding: LeftRightPadding;
  icon: string;
};

export const IntegrationsHeader: FC<IntegrationsHeaderProps> = ({
  handleFormReturn,
  integrationName,
  leftRightPadding,
  icon,
}) => {
  const { width } = useWindowDimensions();

  return (
    <Flex className={styles.IntegrationsHeader} px={leftRightPadding}>
      <Flex align="center" justify="between" width="100%" px={leftRightPadding}>
        <Flex
          gap={{
            initial: "3",
            xs: "4",
          }}
          align="center"
        >
          {width > 500 ? (
            <Button size="1" variant="surface" onClick={handleFormReturn}>
              <ArrowLeftIcon width="16" height="16" />
              Configurations
            </Button>
          ) : (
            <IconButton size="2" variant="surface" onClick={handleFormReturn}>
              <ArrowLeftIcon width="16" height="16" />
            </IconButton>
          )}
          <img
            src={icon}
            className={styles.IntegrationsHeaderIcon}
            alt={integrationName}
          />
          <Heading as="h5" size="3">
            Setup{" "}
            {integrationName.includes("TEMPLATE")
              ? integrationName.startsWith("cmdline")
                ? "Command Line Tool"
                : "Command Line Service"
              : toPascalCase(integrationName)}
          </Heading>
        </Flex>
      </Flex>
    </Flex>
  );
};
