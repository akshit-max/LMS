//go:build ignore

package main

import (
	"context"
	"log"

	"grammoquest/internal/config"
	"grammoquest/internal/repository"
	"grammoquest/internal/service"
)

func main() {
	cfg := config.Load()
	fb := config.InitFirebase(cfg)
	defer fb.Firestore.Close()

	chapterRepo := repository.NewChapterRepository(fb.Firestore)
	chapterStatusRepo := repository.NewChapterStatusRepository(fb.Firestore)
	attemptRepo := repository.NewAttemptRepository(fb.Firestore)
	unlockRepo := repository.NewUnlockRequestRepository(fb.Firestore)
	notifRepo := repository.NewNotificationRepository(fb.Firestore)
	unitRepo := repository.NewUnitRepository(fb.Firestore)

	progressionService := service.NewProgressionService(
		chapterRepo, chapterStatusRepo, attemptRepo, unlockRepo, notifRepo, unitRepo,
	)

	userID := "zq7eRC825Uchit5Jena0wZqfPAP2"
	unitID := "unit-2"

	completed, err := progressionService.EvaluateUnitCompletion(context.Background(), userID, unitID)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}

	log.Printf("EvaluateUnitCompletion for %s: %v", unitID, completed)
}
