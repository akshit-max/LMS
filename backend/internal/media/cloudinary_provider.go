package media

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// CloudinaryProvider implements MediaService using Cloudinary.
type CloudinaryProvider struct {
	cld *cloudinary.Cloudinary
}

// NewCloudinaryProvider initializes a new Cloudinary provider.
func NewCloudinaryProvider(cloudName, apiKey, apiSecret string) (*CloudinaryProvider, error) {
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cloudinary: %w", err)
	}
	return &CloudinaryProvider{cld: cld}, nil
}

// UploadMedia uploads a local file to Cloudinary and returns a secure URL
// that opens inline in the browser (no forced download).
func (p *CloudinaryProvider) UploadMedia(ctx context.Context, filePath string, folder string) (string, error) {
	ext := strings.ToLower(filepath.Ext(filePath))
	resourceType := "auto"
	format := ""

	switch ext {
	case ".pdf":
		// Must be uploaded as "image" so Cloudinary delivers it inline (Content-Type: application/pdf)
		// NOTE: Cloudinary blocks PDF delivery by default on new accounts. 
		// You MUST go to Cloudinary Settings -> Security -> uncheck "Restrict PDF delivery".
		resourceType = "image"
	case ".mkv", ".avi", ".mov":
		// Transcode legacy formats to mp4 for universal browser support.
		resourceType = "video"
		format = "mp4"
	case ".mp4", ".webm", ".ogg":
		resourceType = "video"
	}

	params := uploader.UploadParams{
		Folder:       folder,
		ResourceType: resourceType,
	}
	if format != "" {
		params.Format = format
	}

	resp, err := p.cld.Upload.Upload(ctx, filePath, params)
	if err != nil {
		return "", fmt.Errorf("failed to upload media to cloudinary: %w", err)
	}

	return resp.SecureURL, nil
}
