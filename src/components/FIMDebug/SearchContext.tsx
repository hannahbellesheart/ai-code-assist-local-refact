import React from "react";
import { Heading, Flex, Container } from "@radix-ui/themes";
import { FileList } from "../FileList";
import { SymbolList } from "./SymoblList";

import type { FIMContext } from "../../events";

export type SearchContextProps = {
  data: FIMContext;
};

export const SearchContext: React.FC<SearchContextProps> = ({ data }) => {
  return (
    <Flex direction="column">
      {data.attached_files && data.attached_files.length > 0 && (
        <Container py="3">
          <Heading as="h4" size="2" mb="2">
            Context files
          </Heading>
          <FileList files={data.attached_files} />
        </Container>
      )}
      {data.was_looking_for && data.was_looking_for.length > 0 && (
        <Container py="3">
          <Heading as="h4" size="2" mb="4">
            Look up symbols
          </Heading>
          <SymbolList symbols={data.was_looking_for} />
        </Container>
      )}
    </Flex>
  );
};
