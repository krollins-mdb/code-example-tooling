import { useState, ReactNode } from "react";
import { AcalaContext } from "./AcalaContext";

import {
  SearchResponse,
  CodeExample,
  RequestType,
  RequestProperties,
  HandleRequestProperties,
  AiSummaryPayload,
} from "../constants/types";

// Acala stands for "Ask CAL API".
export const AcalaProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [results, setResults] = useState<CodeExample[]>([]);
  const [searchQueryId, setSearchQueryId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const baseUrl =
    window.location.hostname === "localhost"
      ? "http://localhost:8888"
      : "https://ask-cal.netlify.app";

  const handleRequest = async ({
    url,
    options,
    requestType,
  }: HandleRequestProperties) => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(response.statusText);

      if (requestType === RequestType.GetAiSummary && response.body) {
        // Stream handling
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let done = false;

        setLoading(false);

        // TODO: investigate why it isn't rendering chunks and we only get
        // the final result.
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            result += chunk;
            setAiSummary(result);
          }
        }
        return { summary: result };
      }

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else if (error instanceof TypeError) {
        setApiError("Network error. Please try again later.");
      } else if (error instanceof SyntaxError) {
        setApiError("Invalid response format.");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleMockRequest = async ({
    requestType,
  }: HandleRequestProperties) => {
    setLoading(true);
    setApiError(null);

    setResults([]);

    try {
      const response = {
        ok: true,
        json: async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const mockResponse: SearchResponse = {
            queryId: "fake-string-id",
            codeExamples: [
              {
                code: '// <MongoCollection set up code here>\n\n// Creates a projection to exclude the "_id" field from the retrieved documents\nBson projection = Projections.excludeId();\n\n// Creates a filter to match documents with a "color" value of "green"\nBson filter = Filters.eq("color", "green");\n\n// Creates an update document to set the value of "food" to "pizza"\nBson update = Updates.set("food", "pizza");\n\n// Defines options that specify projected fields, permit an upsert and limit execution time\nFindOneAndUpdateOptions options = new FindOneAndUpdateOptions().\n        projection(projection).\n        upsert(true).\n        maxTime(5, TimeUnit.SECONDS);\n\n// Updates the first matching document with the content of the update document, applying the specified options\nDocument result = collection.findOneAndUpdate(filter, update, options);\n\n// Prints the matched document in its state before the operation\nSystem.out.println(result.toJson());',
                language: "java",
                category: "Usage example",
                pageUrl:
                  "https://mongodb.com/docs/drivers/java/sync/current/crud/compound-operations",
                projectName: "java",
                pageTitle:
                  "Compound Operations - Java Sync Driver v5.5 - MongoDB Docs",
                pageDescription: "",
              },
              {
                code: '// <MongoCollection set up code here>\n\n// Creates instructions to replace the matching document with a new document\nBson filter = Filters.eq("color", "green");\nDocument replace = new Document("music", "classical").append("color", "green");\n\n// Defines options specifying that the operation should return a document in its post-operation state\nFindOneAndReplaceOptions options = new FindOneAndReplaceOptions().\n        returnDocument(ReturnDocument.AFTER);\n\n// Atomically finds and replaces the matching document and prints the replacement document\nDocument result = collection.findOneAndReplace(filter, replace, options);\nSystem.out.println(result.toJson());',
                language: "java",
                category: "Usage example",
                pageUrl:
                  "https://mongodb.com/docs/drivers/java/sync/current/crud/compound-operations",
                projectName: "java",
                pageTitle:
                  "Compound Operations - Java Sync Driver v5.5 - MongoDB Docs",
                pageDescription: "",
              },
            ],
          };

          switch (requestType) {
            case RequestType.Search:
              return mockResponse;
            case RequestType.ReportFeedback:
              return { success: true };
            case RequestType.RequestExample:
              return { success: true };
            default:
              throw new Error("Invalid request type");
          }
        },
      };

      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else if (error instanceof TypeError) {
        setApiError("Network error. Please try again later.");
      } else if (error instanceof SyntaxError) {
        setApiError("Invalid response format.");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const search = async ({ bodyContent, mock }: RequestProperties) => {
    const url = `${baseUrl}/.netlify/functions/search`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyContent),
    };

    if (mock) {
      const data = (await handleMockRequest({
        url,
        options,
        requestType: RequestType.Search,
      })) as SearchResponse;

      setSearchQueryId(data.queryId as string);
      setResults(data.codeExamples);

      return;
    }

    const data = (await handleRequest({
      url,
      options,
      requestType: RequestType.Search,
    })) as SearchResponse;
    const rawResults = data.codeExamples;
    console.log("rawResults", rawResults);

    // for every result in rawResults, look at the pageTitle and remove
    // the substring " - MongoDB Docs" from the end of the string.
    rawResults.forEach((result) => {
      if (result.pageTitle.endsWith(" - MongoDB Docs")) {
        result.pageTitle = result.pageTitle.slice(
          0,
          result.pageTitle.length - " - MongoDB Docs".length
        );
      }
    });

    setSearchQueryId(data.queryId as string);
    setResults(rawResults);

    return;
  };

  const getAiSummary = async (payload: AiSummaryPayload) => {
    const url = `${baseUrl}/.netlify/functions/ai-summary`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };

    const data = await handleRequest({
      url,
      options,
      requestType: RequestType.GetAiSummary,
    });

    if (data) {
      setAiSummary(data.summary);
    } else {
      setApiError("Failed to fetch AI summary.");
    }

    return;
  };

  const reportFeedback = async ({ bodyContent, mock }: RequestProperties) => {
    const url = `${baseUrl}/.netlify/functions/feedback`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyContent),
    };

    if (mock) {
      return await handleMockRequest({
        url,
        options,
        requestType: RequestType.ReportFeedback,
      });
    }

    return await handleRequest({
      url,
      options,
      requestType: RequestType.ReportFeedback,
    });
  };

  const requestExample = async ({ bodyContent, mock }: RequestProperties) => {
    const url = `${baseUrl}/.netlify/functions/request-example`;
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyContent),
    };

    if (mock) {
      return await handleMockRequest({
        url,
        options,
        requestType: RequestType.RequestExample,
      });
    }

    return await handleRequest({
      url,
      options,
      requestType: RequestType.RequestExample,
    });
  };

  return (
    <AcalaContext.Provider
      value={{
        search,
        searchQueryId,
        reportFeedback,
        requestExample,
        getAiSummary,
        results,
        aiSummary,
        loading,
        apiError,
      }}
    >
      {children}
    </AcalaContext.Provider>
  );
};
