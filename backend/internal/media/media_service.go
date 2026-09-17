package media

import "context"

// MediaService provides a storage-agnostic interface for media operations.
// This decouples our application domain from the underlying provider (e.g. Cloudinary).
type MediaService interface {
	// UploadMedia uploads a file and returns the secure public URL.
	// folder is optional (e.g., "lessons", "avatars").
	UploadMedia(ctx context.Context, filePath string, folder string) (url string, err error)
}
