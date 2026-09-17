package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"grammoquest/internal/config"
	"grammoquest/internal/media"
	"grammoquest/internal/router"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Firebase Admin SDK
	fb := config.InitFirebase(cfg)
	defer fb.Firestore.Close()

	// Initialize Media Provider (Cloudinary)
	var mediaSvc media.MediaService
	if cfg.CloudinaryCloudName != "" {
		provider, err := media.NewCloudinaryProvider(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
		if err != nil {
			log.Fatalf("failed to init cloudinary: %v", err)
		}
		mediaSvc = provider
		log.Println("media: Cloudinary initialized successfully")
	} else {
		log.Println("media: Cloudinary not configured, media uploads will fail")
	}

	// Build router
	handler := router.New(fb, cfg, mediaSvc)

	// Configure HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("grammoquest-api: listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-shutdown
	log.Println("grammoquest-api: shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}

	log.Println("grammoquest-api: stopped")
}
