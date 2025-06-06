package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
	uri := os.Getenv("MONGODB_URI")
	docs := "www.mongodb.com/docs/drivers/go/current/"
	if uri == "" {
		log.Fatal("Set your 'MONGODB_URI' environment variable. " +
			"See: " + docs +
			"usage-examples/#environment-variable")
	}
	client, err := mongo.Connect(options.Client().
		ApplyURI(uri))
	if err != nil {
		panic(err)
	}
	ctx := context.Background()
	defer func() {
		if err := client.Disconnect(ctx); err != nil {
			panic(err)
		}
	}()

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		log.Fatal("Set your 'DB_NAME' environment variable. ")
	}

	/* To copy the DB for testing, uncomment the following line.
	 * Optionally, comment out lines 46-47 below to skip performing an aggregation after copying the DB.
	 * NOTE: Update the DB name in the CopyDBForTesting func.
	 */
	//updates.CopyDBForTesting(client, ctx)

	// To perform aggregations
	db := client.Database(dbName)
	PerformAggregation(db, ctx)

	// Add product and sub-product names
	//updates.AddProductNames(db, ctx)

	// To rename a field in the document
	//updates.RenameField(db, ctx)

	// To change the value of a field in the CodeNode object
	//updates.RenameValue(db, ctx)
}
