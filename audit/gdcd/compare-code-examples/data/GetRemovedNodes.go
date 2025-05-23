package data

import (
	"common"
	"gdcd/types"
	"time"
)

func GetRemovedNodes() (common.CodeNode, types.ASTNode) {
	codeText := `
#include <mongoc/mongoc.h>
#include <bson/bson.h>

int main(void) {

  mongoc_uri_t* uri = NULL;
  mongoc_client_t *client = NULL;
  mongoc_database_t *database = NULL;
  bson_t *ping = NULL, reply = BSON_INITIALIZER;
  bson_error_t error;

  mongoc_init();

  // Start example code here

  // End example code here

  database = mongoc_client_get_database (client, "admin");
    
  ping = BCON_NEW ("ping", BCON_INT32 (1));
   
  if (!mongoc_client_command_simple (client, "admin", ping, NULL, &reply, &error)) {
    fprintf (stderr, "%s\n", error.message);
    goto cleanup;
  }
  printf ("Pinged your deployment. You successfully connected to MongoDB!\n");

  cleanup:
    bson_destroy (&reply);
    bson_destroy (ping);
    mongoc_database_destroy (database);
    mongoc_client_destroy (client);
    mongoc_uri_destroy (uri);
    mongoc_cleanup ();
}`

	codeNode := common.CodeNode{
		Code:           codeText,
		Language:       "c",
		FileExtension:  ".c",
		Category:       "Usage example",
		SHA256Hash:     "422b3486866301e76fe74d41441f075a7640091dd9b110d0783134a3f4b2c69f",
		LLMCategorized: true,
		DateAdded:      time.Now(),
		IsRemoved:      false,
	}

	astNode := types.ASTNode{
		Type:           "code",
		Position:       types.Position{Start: types.PositionLine{Line: 51}},
		Children:       nil,
		Value:          "#include \n some arbitrary text",
		Lang:           "c",
		Copyable:       true,
		Entries:        nil,
		EnumType:       "",
		ID:             "",
		Domain:         "",
		Name:           "",
		Argument:       nil,
		Options:        nil,
		EmphasizeLines: types.EmphasizeLines{14, 16},
	}
	return codeNode, astNode
}
