-- CreateTable
-- This is a metadata-only migration to normalize field naming conventions
-- All field names are now camelCase with @map directives to existing snake_case columns
-- No actual database schema changes are made

-- Phase 1: Prisma model field naming normalization
-- ✅ Couple.partner1UserId, partner2UserId (was partner1_user_id, partner2_user_id)  
-- ✅ Guest.attendingCount, invitationSentAt, rsvpDeadline (@map added)
-- ✅ Invitation.coupleId, invitedAt (was couple_id, invited_at)
-- ✅ VendorCategory.industryTypical, displayOrder, updatedAt (@map added)
-- ✅ All relation names converted to camelCase (vendorDocuments, budgetItems, etc.)
-- ✅ Removed budget_total duplicate field from Couple
-- ✅ Removed legacy_notifications relation from Couple

-- No database schema changes required - this migration normalizes TypeScript/Prisma naming only