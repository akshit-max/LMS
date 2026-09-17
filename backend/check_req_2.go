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

	unlockRepo := repository.NewUnlockRequestRepository(fb.Firestore)

	userID := "zq7eRC825Uchit5Jena0wZqfPAP2"
	reqs, err := unlockRepo.GetForUser(context.Background(), userID)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}

	for _, r := range reqs {
		fmt.Printf("Req ID: %s, Status: %s, UnitID: %s, ToUnitID: %s\n", r.ID, r.Status, r.UnitID, r.ToUnitID)
	}
}
