import styles from "./ResultsPage.module.css";
import { useState } from "react";

// Leafygreen UI components
import Card from "@leafygreen-ui/card";
import Code from "@leafygreen-ui/code";
import Button from "@leafygreen-ui/button";
import Icon from "@leafygreen-ui/icon";
import Badge from "@leafygreen-ui/badge";
import { PageLoader } from "@leafygreen-ui/loading-indicator";
import { Body, H2, H3, Link, InlineCode } from "@leafygreen-ui/typography";
import {
  DisplayMode,
  Drawer,
  DrawerStackProvider,
} from "@leafygreen-ui/drawer";

// Types
import { CodeExample } from "../../constants/types";
import { DocsSetDisplayValues, DocsSet } from "../../constants/docsSets";

// App components
import { useAcala, useSearch } from "../../providers/Hooks";
import CodeExamplePlaceholder from "../../components/code-example-placeholder/CodeExamplePlaceholder";
import Header from "../../components/header/Header";

function Resultspage() {
  const [selectedCodeExample, setSelectedCodeExample] =
    useState<CodeExample | null>(null);
  const [openAiDrawer, setOpenAiDrawer] = useState(false);

  const { getAiSummary, aiSummary, loadingRequest } = useAcala();
  const { results, requestObject } = useSearch();

  const handleAiSummary = async (code: string, pageUrl: string) => {
    try {
      await getAiSummary({ code, pageUrl });
    } catch (error) {
      console.error("Error fetching AI summary:", error);
    }
  };

  const parseLanguage = (language: string) => {
    switch (language) {
      case "undefined":
        return "javascript";
      case "text":
        return "javascript";
      default:
        return language;
    }
  };

  const findDocsSetDisplayValue = (value: string) => {
    // use value as key to find the display value in DocsSetDisplayValues
    const docsSet = Object.keys(DocsSetDisplayValues).find(
      (key) => key.toLowerCase() === value.toLowerCase()
    ) as DocsSet;

    return DocsSetDisplayValues[docsSet] || value;
  };

  return (
    <div className={styles.results_page}>
      <Header isHomepage={false} />

      <div className={styles.horizontal_container}>
        <div className={styles.results_container}>
          {results && (
            <div className={styles.results}>
              {results.length ? (
                <Body>
                  {results.length} results found for{" "}
                  <InlineCode>
                    {requestObject?.bodyContent.queryString}
                  </InlineCode>
                  {/* TODO: add facet information */}
                </Body>
              ) : (
                <Body baseFontSize={16}>
                  Search for code examples using the search box
                </Body>
              )}
              <div className={styles.results_list}>
                {results.map((result, index) => (
                  <Card
                    as="div"
                    contentStyle="clickable"
                    onClick={() => {
                      setSelectedCodeExample(result);
                    }}
                    key={index}
                  >
                    <H3>{result.pageTitle}</H3>

                    <Code
                      language={parseLanguage(result.language)}
                      expandable={true}
                      className={styles.code_example}
                    >
                      {result.code}
                    </Code>

                    <div className={styles.badge_container}>
                      <Badge variant="blue">{result.language}</Badge>
                      <Badge variant="green">{result.category}</Badge>
                      {result.projectName && (
                        <Badge variant="yellow">
                          {findDocsSetDisplayValue(result.projectName)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!results && (
            <div>
              <Body>No results found. Try a different search query.</Body>
            </div>
          )}
        </div>

        <div className={styles.example_container}>
          {!selectedCodeExample && <CodeExamplePlaceholder />}

          {selectedCodeExample && (
            <>
              <H2>{selectedCodeExample.pageTitle}</H2>
              <Link href={selectedCodeExample.pageUrl}>
                {" "}
                {selectedCodeExample.pageUrl}{" "}
              </Link>

              {selectedCodeExample.pageDescription && (
                <Body
                  baseFontSize={16}
                  className={styles.page_description}
                >
                  {selectedCodeExample.pageDescription}
                </Body>
              )}

              <div className={styles.example_body}>
                <Code
                  language={parseLanguage(selectedCodeExample.language)}
                  className={styles.code_example}
                  showLineNumbers={true}
                  onCopy={() => {
                    navigator.clipboard.writeText(selectedCodeExample.code);
                  }}
                >
                  {selectedCodeExample.code}
                </Code>

                {!openAiDrawer && (
                  <Button
                    leftGlyph={<Icon glyph="Sparkle" />}
                    aria-label="Some Menu"
                    className={styles.summary_button}
                    onClick={() => {
                      setOpenAiDrawer(true);
                      handleAiSummary(
                        selectedCodeExample.code,
                        selectedCodeExample.pageUrl
                      );
                    }}
                  >
                    Explain this code
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {selectedCodeExample && (
          <div className={styles.summary_container}>
            <DrawerStackProvider>
              <Drawer
                displayMode={DisplayMode.Overlay}
                onClose={() => {
                  setOpenAiDrawer(false);
                  // setOpenResultsDrawer(true);
                }}
                open={openAiDrawer}
                title="AI Summary"
              >
                {loadingRequest ? (
                  <PageLoader description="Asking the robots..." />
                ) : (
                  <Body
                    baseFontSize={16}
                    className={styles.ai_summary}
                  >
                    {aiSummary}
                  </Body>
                )}
              </Drawer>
            </DrawerStackProvider>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resultspage;
