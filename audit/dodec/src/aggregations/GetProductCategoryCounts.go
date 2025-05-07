package aggregations

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

// GetProductCategoryCounts returns a `nestedOneLevelMap` data structure as defined in the PerformAggregation function.
// The first string key is the product name. The second string key is the category name. The int count
// is the sum of all code examples in the category within the product.
func GetProductCategoryCounts(db *mongo.Database, collectionName string, productCategoryMap map[string]map[string]int, ctx context.Context) map[string]map[string]int {
	collection := db.Collection(collectionName)
	categoryPipeline := mongo.Pipeline{
		{{"$match", bson.D{
			{"_id", bson.D{{"$ne", "summaries"}}},
			{"nodes", bson.D{{"$ne", nil}}}, // Ensure nodes is not null
		}}},
		{{"$unwind", bson.D{{"path", "$nodes"}}}},
		// Filter to omit nodes that have been removed from a docs page
		{{"$match", bson.D{
			{"$or", bson.A{
				bson.D{{"nodes.is_removed", bson.D{{"$exists", false}}}},
				bson.D{{"nodes.is_removed", false}},
			}},
		}}},
		{{
			"$group", bson.D{
				{"_id", bson.D{
					{"product", "$product"},
					{"category", "$nodes.category"},
				}},
				{"codeNodeCount", bson.D{{"$sum", 1}}},
			},
		}},
	}
	cursor, err := collection.Aggregate(ctx, categoryPipeline)
	if err != nil {
		log.Fatalf("Failed to execute aggregation in collection %s: %v", collectionName, err)
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var result struct {
			ID struct {
				Product  string `bson:"product"`
				Category string `bson:"category"`
			} `bson:"_id"`
			CodeNodeCount int `bson:"codeNodeCount"`
		}
		if err := cursor.Decode(&result); err != nil {
			log.Fatal(err)
		}
		if _, exists := productCategoryMap[result.ID.Product]; !exists {
			productCategoryMap[result.ID.Product] = make(map[string]int)
		}
		productCategoryMap[result.ID.Product][result.ID.Category] += result.CodeNodeCount
	}
	if err := cursor.Err(); err != nil {
		log.Fatalf("Cursor error in collection %s: %v", collectionName, err)
	}
	return productCategoryMap
}
