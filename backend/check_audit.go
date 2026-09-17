//go:build ignore

package main

import (
	"context"
	"fmt"
	"log"

	"grammoquest/internal/config"
	"google.golang.org/api/iterator"
)

func main() {
	cfg := config.Load()
	fb := config.InitFirebase(cfg)
	defer fb.Firestore.Close()

	iter := fb.Firestore.Collection("auditLogs").Documents(context.Background())
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Fatalf("Error: %v", err)
		}
		data := doc.Data()
		fmt.Printf("AuditLog Action: %v, Details: %v\n", data["action"], data["details"])
	}
}
