package compare_code_examples

import (
	"common"
	"context"
	"gdcd/snooty"
	"gdcd/types"
	"log"

	"github.com/tmc/langchaingo/llms/ollama"
)

// CompareExistingIncomingCodeExampleSlices takes []common.CodeNode, which represents the existing code example nodes from
// Atlas, and []types.ASTNode, which represents incoming code examples from the Snooty Data API. It also takes a types.ProjectReport
// to track various project changes and counts. This function compares the existing code examples with the incoming code examples
// to find unchanged, updated, new, and removed nodes. It appends these nodes into an updated []common.CodeNode slice,
// which it returns to the call site for making updates to Atlas. It also returns the updated types.ProjectReport.
func CompareExistingIncomingCodeExampleSlices(existingNodes []common.CodeNode, existingRemovedNodes []common.CodeNode, incomingNodes []types.ASTNode, report types.ProjectReport, pageId string, llm *ollama.LLM, ctx context.Context, isDriversProject bool) ([]common.CodeNode, types.ProjectReport) {
	var updatedPageNodes []types.ASTNode
	var newPageNodes []types.ASTNode
	var unchangedPageNodes []types.ASTNode
	incomingCount := len(incomingNodes)

	snootySha256Hashes := make(map[string]int)
	existingSha256Hashes := make(map[string]int)
	existingSha256ToCodeNodeMap := make(map[string]common.CodeNode)
	incomingUnchangedSha256ToCodeNodeMap := make(map[string]common.CodeNode)
	incomingUpdatedSha256ToCodeNodeMap := make(map[string]common.CodeNode)
	for _, node := range incomingNodes {
		incomingNodeSha256Hash := snooty.MakeSha256HashForCode(node.Value)
		snootySha256Hashes[incomingNodeSha256Hash]++
	}
	for _, node := range existingNodes {
		existingSha256Hashes[node.SHA256Hash]++
		existingSha256ToCodeNodeMap[node.SHA256Hash] = node
	}

	for _, node := range incomingNodes {
		hash := snooty.MakeSha256HashForCode(node.Value)
		bucketName, existingNode := ChooseBucketForNode(existingNodes, existingSha256Hashes, node)
		switch bucketName {
		case unchanged:
			if existingNode != nil {
				incomingUnchangedSha256ToCodeNodeMap[hash] = *existingNode
			}
			unchangedPageNodes = append(unchangedPageNodes, node)
		case updated:
			if existingNode != nil {
				incomingUpdatedSha256ToCodeNodeMap[hash] = *existingNode
			}
			updatedPageNodes = append(updatedPageNodes, node)
		case newExample:
			newPageNodes = append(newPageNodes, node)
		default:
			log.Printf("Bucket '%s' not found in existing nodes\n", bucketName)
		}
	}
	removedNodes := FindRemovedNodes(existingSha256ToCodeNodeMap, unchangedPageNodes, updatedPageNodes, newPageNodes)

	codeNodesToReturn := make([]common.CodeNode, 0)
	codeNodesToReturn, report = MakeUpdatedCodeNodesArray(removedNodes, existingRemovedNodes, unchangedPageNodes,
		existingSha256ToCodeNodeMap, updatedPageNodes, incomingUpdatedSha256ToCodeNodeMap, newPageNodes,
		existingNodes, incomingCount, report, pageId, llm, ctx, isDriversProject)
	return codeNodesToReturn, report
}
