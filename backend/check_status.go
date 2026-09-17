//go:build ignore

package main

import (
	"context"
	"fmt"
	"log"

	"grammoquest/internal/config"
	"grammoquest/internal/repository"
)

func main() {
	cfg := config.Load()
	fb := config.InitFirebase(cfg)
	defer fb.Firestore.Close()

	chapterStatusRepo := repository.NewChapterStatusRepository(fb.Firestore)

	userID := "zq7eRC825Uchit5Jena0wZqfPAP2"
	statuses, err := chapterStatusRepo.GetAllForUser(context.Background(), userID)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}

	for _, st := range statuses {
		fmt.Printf("ChapterID: %s, UnitID: %s, Status: %s\n", st.ChapterID, st.UnitID, st.Status)
	}
}
