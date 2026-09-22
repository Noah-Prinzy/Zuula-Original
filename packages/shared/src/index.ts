// Hand-written convenience layer over the generated OpenAPI types. Keep this file thin — add
// an alias here when a type is used often enough across apps/web and apps/api to be worth a
// short name; everything else is reachable via `components["schemas"][...]` directly.

import type { components, operations, paths } from "./openapi"

export type { components, operations, paths }

type Schemas = components["schemas"]

export type Verdict = Schemas["Verdict"]
export type ContentType = Schemas["ContentType"]
export type ClaimAssessment = Schemas["ClaimAssessment"]
export type CitationStance = Schemas["CitationStance"]
export type RaterRole = Schemas["RaterRole"]
export type Role = Schemas["Role"]
export type ApiScope = Schemas["ApiScope"]
export type LocaleCode = Schemas["LocaleCode"]
export type ReviewReason = Schemas["ReviewReason"]
export type AuditAction = Schemas["AuditAction"]

export type Claim = Schemas["Claim"]
export type Citation = Schemas["Citation"]
export type AISignal = Schemas["AISignal"]
export type ExpertAnnotation = Schemas["ExpertAnnotation"]
export type HumanReview = Schemas["HumanReview"]
export type RatingCounts = Schemas["RatingCounts"]
export type RatingComment = Schemas["RatingComment"]
export type CommunityScore = Schemas["CommunityScore"]
export type CommunityRating = Schemas["CommunityRating"]

/** Full report shape — core API only. Use `FactCheckPublic` for anything partner-facing. */
export type FactCheckReport = Schemas["FactCheckReport"]
export type FactCheckSummary = Schemas["FactCheckSummary"]
export type FactCheckPublic = Schemas["FactCheckPublic"]
export type FactCheckSearchItem = Schemas["FactCheckSearchItem"]

export type SubmissionInput = Schemas["SubmissionInput"]
export type SubmissionAccepted = Schemas["SubmissionAccepted"]
export type SubmissionStatusResponse = Schemas["SubmissionStatusResponse"]
export type ActivitySubmission = Schemas["ActivitySubmission"]
export type ActivityRating = Schemas["ActivityRating"]

export type UserProfile = Schemas["UserProfile"]
export type DeviceSession = Schemas["DeviceSession"]
export type ApiKey = Schemas["ApiKey"]
export type AppNotification = Schemas["AppNotification"]
export type AlertSettings = Schemas["AlertSettings"]

export type ReviewCase = Schemas["ReviewCase"]
export type ReviewDecision = Schemas["ReviewDecision"]

export type Kpi = Schemas["Kpi"]
export type AdminUser = Schemas["AdminUser"]
export type ContentReport = Schemas["ContentReport"]
export type ManipulationSignal = Schemas["ManipulationSignal"]
export type TrustedSource = Schemas["TrustedSource"]
export type Broadcast = Schemas["Broadcast"]
export type MonthlyReport = Schemas["MonthlyReport"]
export type AuditEntry = Schemas["AuditEntry"]
export type PlatformSettings = Schemas["PlatformSettings"]

export type ErrorEnvelope = Schemas["ErrorEnvelope"]
export type PageMeta = Schemas["PageMeta"]
