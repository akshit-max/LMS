package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment configuration for the GrammoQuest backend.
type Config struct {
	Port                    string
	FirebaseProjectID       string
	FirebaseCredentialsFile string
	FrontendURL             string
	Environment             string
	CloudinaryCloudName     string
	CloudinaryAPIKey        string
	CloudinaryAPISecret     string
}

// Load reads environment variables from .env (if present) and populates Config.
// In production, environment variables are set directly on the host — no .env file is needed.
func Load() *Config {
	// Load .env file if it exists; silently skip if not present (production)
	if err := godotenv.Load(); err != nil {
		log.Println("config: no .env file found, using environment variables")
	}

	cfg := &Config{
		Port:                    getEnv("PORT", "8080"),
		FirebaseProjectID:       getEnv("FIREBASE_PROJECT_ID", ""),
		FirebaseCredentialsFile: getEnv("FIREBASE_CREDENTIALS_FILE", ""),
		FrontendURL:             getEnv("FRONTEND_URL", "http://localhost:5173"),
		Environment:             getEnv("ENVIRONMENT", "development"),
		CloudinaryCloudName:     getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:        getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret:     getEnv("CLOUDINARY_API_SECRET", ""),
	}

	if cfg.FirebaseProjectID == "" {
		log.Fatal("config: FIREBASE_PROJECT_ID is required")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
