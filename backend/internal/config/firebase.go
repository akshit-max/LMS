package config

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"cloud.google.com/go/firestore"
	"google.golang.org/api/option"
)

// FirebaseClients holds initialized Firebase Admin SDK clients.
// These are initialized once at startup and shared across handlers/services.
type FirebaseClients struct {
	App       *firebase.App
	Auth      *auth.Client
	Firestore *firestore.Client
}

// InitFirebase initializes the Firebase Admin SDK.
// If credentialsFile is set, it uses a service account key file (local dev).
// In production (GCP/Cloud Run), Application Default Credentials are used automatically.
func InitFirebase(cfg *Config) *FirebaseClients {
	ctx := context.Background()

	var app *firebase.App
	var err error

	fbConfig := &firebase.Config{ProjectID: cfg.FirebaseProjectID}

	if cfg.FirebaseCredentialsFile != "" {
		// Local development: use service account key file
		opt := option.WithCredentialsFile(cfg.FirebaseCredentialsFile)
		app, err = firebase.NewApp(ctx, fbConfig, opt)
	} else {
		// Production: use Application Default Credentials
		app, err = firebase.NewApp(ctx, fbConfig)
	}

	if err != nil {
		log.Fatalf("firebase: failed to initialize app: %v", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("firebase: failed to initialize auth client: %v", err)
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalf("firebase: failed to initialize firestore client: %v", err)
	}

	log.Printf("firebase: initialized successfully (project: %s)", cfg.FirebaseProjectID)

	return &FirebaseClients{
		App:       app,
		Auth:      authClient,
		Firestore: firestoreClient,
	}
}
