package media

import (
	"context"
	"os"
	"testing"
)

// TestCloudinaryUpload Integration test to verify Cloudinary configuration.
// Run this manually in development: go test -v -run TestCloudinaryUpload
func TestCloudinaryUpload(t *testing.T) {
	// These would typically come from the environment in a real test run
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		t.Skip("Cloudinary credentials not set, skipping integration test.")
	}

	provider, err := NewCloudinaryProvider(cloudName, apiKey, apiSecret)
	if err != nil {
		t.Fatalf("Failed to init provider: %v", err)
	}

	// Create a dummy file for testing
	tmpFile, err := os.CreateTemp("", "test_image_*.txt")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	_, _ = tmpFile.WriteString("dummy media content")
	tmpFile.Close()

	// Perform upload
	url, err := provider.UploadMedia(context.Background(), tmpFile.Name(), "test_uploads")
	if err != nil {
		t.Fatalf("UploadMedia failed: %v", err)
	}

	if url == "" {
		t.Errorf("Expected a secure URL, got empty string")
	} else {
		t.Logf("Successfully uploaded test media. URL: %s", url)
	}
}
