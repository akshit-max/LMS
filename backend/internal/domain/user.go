package domain

import "time"

// Role constants
const (
	RoleAdmin       = "admin"
	RoleSchoolAdmin = "school_admin"
	RoleTeacher     = "teacher"
	RoleStudent     = "student"
)

// StudentType constants
const (
	StudentTypeIndependent = "independent"
	StudentTypeSchool      = "school"
)

// AccountStatus constants
const (
	AccountStatusPending   = "pending"
	AccountStatusActive    = "active"
	AccountStatusSuspended = "suspended"
	AccountStatusExpired   = "expired"
)

// User represents a GrammoQuest platform user.
// All roles are represented by this struct; the Role field differentiates behaviour.
type User struct {
	UID             string     `firestore:"uid" json:"uid"`
	Email           string     `firestore:"email" json:"email"`
	DisplayName     string     `firestore:"displayName" json:"displayName"`
	Role            string     `firestore:"role" json:"role"`
	StudentType     string     `firestore:"studentType" json:"studentType"` // independent | school (only for role=student)
	AccountStatus   string     `firestore:"accountStatus" json:"accountStatus"`
	InstitutionID   string     `firestore:"institutionId" json:"institutionId"`
	ClassID         string     `firestore:"classId" json:"classId"`
	AvatarID        string     `firestore:"avatarId" json:"avatarId"`
	CreatedAt       time.Time  `firestore:"createdAt" json:"createdAt"`
	ApprovedAt      *time.Time `firestore:"approvedAt" json:"approvedAt"`
	AccessExpiresAt *time.Time `firestore:"accessExpiresAt" json:"accessExpiresAt"`
	DeviceID        string     `firestore:"deviceId" json:"deviceId"`
	IsIndependent   bool       `firestore:"isIndependent" json:"isIndependent"`
}
