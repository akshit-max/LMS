package media

import (
	"context"
	"fmt"

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

// UploadMedia uploads a local file to Cloudinary and returns the secure URL.
func (p *CloudinaryProvider) UploadMedia(ctx context.Context, filePath string, folder string) (string, error) {
	resp, err := p.cld.Upload.Upload(ctx, filePath, uploader.UploadParams{
		Folder: folder,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload media to cloudinary: %w", err)
	}

	return resp.SecureURL, nil
}
