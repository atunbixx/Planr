-- CreateTable
-- Merge legacy_notifications data into notifications_new and create compatibility VIEW

-- Step 1: Ensure notifications_new has all required columns (should already exist)
-- The notifications_new table is our target unified notifications table

-- Step 2: Migrate data from notifications (legacy) to notifications_new
-- Only insert records that don't already exist (handle potential duplicates)
INSERT INTO notifications_new (
    id,
    user_id,
    couple_id,
    type,
    title,
    message,
    data,
    read,
    read_at,
    priority,
    category,
    action_url,
    action_label,
    created_at,
    updated_at,
    expires_at
)
SELECT 
    n.id,
    -- If no specific user, use the couple's primary user or first partner
    COALESCE(c.user_id, c.partner1_user_id) as user_id,
    n.couple_id,
    COALESCE(n.type, 'general') as type,
    n.title,
    n.message,
    '{}' as data, -- Legacy had no data field
    COALESCE(n.read, false) as read,
    CASE 
        WHEN n.read = true THEN n.created_at 
        ELSE NULL 
    END as read_at,
    'medium' as priority, -- Default priority for legacy notifications
    'general' as category, -- Default category for legacy notifications  
    n.action_url,
    NULL as action_label, -- Legacy had no action_label
    n.created_at,
    n.created_at as updated_at, -- Set updated_at to created_at for legacy records
    NULL as expires_at -- Legacy notifications don't expire
FROM notifications n
LEFT JOIN couples c ON n.couple_id = c.id
WHERE NOT EXISTS (
    SELECT 1 FROM notifications_new nn 
    WHERE nn.id = n.id
)
AND c.id IS NOT NULL -- Only migrate notifications with valid couples
AND (c.user_id IS NOT NULL OR c.partner1_user_id IS NOT NULL); -- Ensure we have a user

-- Step 3: Create a VIEW named legacy_notifications for backward compatibility
-- This allows any remaining code that queries legacy_notifications to continue working
DROP VIEW IF EXISTS legacy_notifications;
CREATE VIEW legacy_notifications AS
SELECT 
    id,
    couple_id,
    created_at,
    title,
    message,
    COALESCE(type, 'general') as type,
    read,
    action_url
FROM notifications_new 
WHERE category = 'general'; -- Only show migrated legacy notifications

-- Step 4: Update the Couple model relation
-- The legacy_notifications relation will be removed from the Prisma schema
-- and replaced with the unified notifications relation

-- This migration safely merges legacy notification data while maintaining compatibility