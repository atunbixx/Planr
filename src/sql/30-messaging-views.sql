-- Views for messaging system to simplify queries and improve performance

-- View for conversation summaries with vendor details
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    cv.id as vendor_id,
    cv.couple_id,
    cv.name as vendor_name,
    cv.business_name,
    cv.category as vendor_category,
    cv.status as vendor_status,
    cv.contact_person,
    cv.email as vendor_email,
    cv.phone as vendor_phone,
    cv.last_message_at,
    cv.last_message_preview,
    cv.unread_message_count,
    cv.messaging_enabled,
    cv.preferred_contact_method,
    -- Thread counts
    (SELECT COUNT(*) FROM message_threads mt WHERE mt.vendor_id = cv.id) as total_threads,
    (SELECT COUNT(*) FROM message_threads mt WHERE mt.vendor_id = cv.id AND mt.status = 'open') as open_threads,
    -- Message counts
    (SELECT COUNT(*) FROM vendor_messages vm WHERE vm.vendor_id = cv.id) as total_messages,
    -- Last activity
    GREATEST(
        cv.last_message_at,
        (SELECT MAX(created_at) FROM vendor_messages WHERE vendor_id = cv.id)
    ) as last_activity,
    -- Has attachments
    EXISTS (
        SELECT 1 FROM vendor_messages vm
        JOIN message_media mm ON mm.message_id = vm.id
        WHERE vm.vendor_id = cv.id
    ) as has_attachments,
    -- Has scheduled messages
    EXISTS (
        SELECT 1 FROM scheduled_messages sm
        WHERE sm.vendor_id = cv.id AND sm.status = 'pending'
    ) as has_scheduled_messages
FROM couple_vendors cv
WHERE cv.messaging_enabled = true;

-- View for recent conversations with last message details
CREATE OR REPLACE VIEW recent_conversations AS
WITH last_messages AS (
    SELECT DISTINCT ON (vendor_id)
        vendor_id,
        id as message_id,
        content,
        sender_type,
        sender_name,
        message_type,
        created_at,
        is_read,
        thread_id
    FROM vendor_messages
    ORDER BY vendor_id, created_at DESC
)
SELECT 
    cv.id as vendor_id,
    cv.couple_id,
    cv.name as vendor_name,
    cv.business_name,
    cv.category,
    cv.contact_person,
    lm.message_id as last_message_id,
    lm.content as last_message_content,
    lm.sender_type as last_sender_type,
    lm.sender_name as last_sender_name,
    lm.message_type as last_message_type,
    lm.created_at as last_message_time,
    lm.is_read as last_message_read,
    lm.thread_id as last_thread_id,
    cv.unread_message_count,
    -- Time since last message
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lm.created_at))::INTEGER as seconds_since_last_message,
    -- Thread info if exists
    mt.subject as thread_subject,
    mt.thread_type,
    mt.priority as thread_priority,
    mt.status as thread_status
FROM couple_vendors cv
LEFT JOIN last_messages lm ON lm.vendor_id = cv.id
LEFT JOIN message_threads mt ON mt.id = lm.thread_id
WHERE cv.messaging_enabled = true
ORDER BY lm.created_at DESC NULLS LAST;

-- View for unread message counts by vendor category
CREATE OR REPLACE VIEW unread_by_category AS
SELECT 
    cv.couple_id,
    cv.category,
    COUNT(DISTINCT cv.id) as vendors_with_unread,
    SUM(cv.unread_message_count) as total_unread_messages
FROM couple_vendors cv
WHERE cv.unread_message_count > 0
AND cv.messaging_enabled = true
GROUP BY cv.couple_id, cv.category;

-- View for message statistics by vendor
CREATE OR REPLACE VIEW message_statistics AS
SELECT 
    vm.vendor_id,
    vm.couple_id,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE vm.sender_type = 'couple') as messages_from_couple,
    COUNT(*) FILTER (WHERE vm.sender_type = 'vendor') as messages_from_vendor,
    COUNT(*) FILTER (WHERE vm.sender_type = 'system') as system_messages,
    COUNT(*) FILTER (WHERE vm.is_read = false AND vm.sender_type != 'couple') as unread_messages,
    COUNT(DISTINCT vm.thread_id) as thread_count,
    COUNT(DISTINCT DATE(vm.created_at)) as active_days,
    MIN(vm.created_at) as first_message_at,
    MAX(vm.created_at) as last_message_at,
    AVG(
        CASE 
            WHEN vm.sender_type = 'vendor' AND LAG(vm.sender_type) OVER (PARTITION BY vm.vendor_id ORDER BY vm.created_at) = 'couple'
            THEN EXTRACT(EPOCH FROM (vm.created_at - LAG(vm.created_at) OVER (PARTITION BY vm.vendor_id ORDER BY vm.created_at)))
        END
    )::INTEGER as avg_vendor_response_time_seconds
FROM vendor_messages vm
GROUP BY vm.vendor_id, vm.couple_id;

-- View for thread summaries
CREATE OR REPLACE VIEW thread_summaries AS
SELECT 
    mt.id as thread_id,
    mt.vendor_id,
    mt.couple_id,
    mt.subject,
    mt.thread_type,
    mt.priority,
    mt.status,
    mt.message_count,
    mt.unread_count,
    mt.created_at,
    mt.updated_at,
    mt.resolved_at,
    mt.archived_at,
    -- First message preview
    fm.content as first_message_preview,
    fm.sender_type as first_sender_type,
    -- Last message preview
    lm.content as last_message_preview,
    lm.sender_type as last_sender_type,
    lm.created_at as last_message_at,
    -- Time metrics
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - mt.created_at))::INTEGER as thread_age_seconds,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - mt.updated_at))::INTEGER as seconds_since_update,
    CASE 
        WHEN mt.resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (mt.resolved_at - mt.created_at))::INTEGER 
        ELSE NULL 
    END as resolution_time_seconds
FROM message_threads mt
LEFT JOIN vendor_messages fm ON fm.id = mt.first_message_id
LEFT JOIN vendor_messages lm ON lm.id = mt.last_message_id;

-- View for vendor communication dashboard
CREATE OR REPLACE VIEW vendor_communication_dashboard AS
SELECT 
    cv.couple_id,
    cv.id as vendor_id,
    cv.name as vendor_name,
    cv.business_name,
    cv.category,
    cv.status as vendor_status,
    cv.contact_person,
    cv.email,
    cv.phone,
    cv.messaging_enabled,
    cv.preferred_contact_method,
    -- Message metrics
    COALESCE(ms.total_messages, 0) as total_messages,
    COALESCE(ms.messages_from_couple, 0) as messages_sent,
    COALESCE(ms.messages_from_vendor, 0) as messages_received,
    COALESCE(cv.unread_message_count, 0) as unread_count,
    -- Time metrics
    ms.first_message_at,
    ms.last_message_at,
    cv.last_message_at as last_activity,
    cv.last_message_preview,
    -- Response time
    ms.avg_vendor_response_time_seconds,
    CASE 
        WHEN ms.avg_vendor_response_time_seconds < 3600 THEN 'Very Responsive'
        WHEN ms.avg_vendor_response_time_seconds < 86400 THEN 'Responsive'
        WHEN ms.avg_vendor_response_time_seconds < 259200 THEN 'Moderate'
        ELSE 'Slow'
    END as responsiveness_rating,
    -- Thread metrics
    COALESCE(ms.thread_count, 0) as thread_count,
    COALESCE((
        SELECT COUNT(*) FROM message_threads 
        WHERE vendor_id = cv.id AND status = 'open'
    ), 0) as open_threads,
    -- Attachment count
    COALESCE((
        SELECT COUNT(*) FROM vendor_messages vm
        JOIN message_media mm ON mm.message_id = vm.id
        WHERE vm.vendor_id = cv.id
    ), 0) as attachment_count,
    -- Scheduled messages
    COALESCE((
        SELECT COUNT(*) FROM scheduled_messages
        WHERE vendor_id = cv.id AND status = 'pending'
    ), 0) as pending_scheduled_messages
FROM couple_vendors cv
LEFT JOIN message_statistics ms ON ms.vendor_id = cv.id;

-- View for message search results
CREATE OR REPLACE VIEW message_search_results AS
SELECT 
    vm.id as message_id,
    vm.vendor_id,
    vm.couple_id,
    vm.thread_id,
    vm.sender_type,
    vm.sender_name,
    vm.message_type,
    vm.content,
    vm.created_at,
    vm.is_read,
    cv.name as vendor_name,
    cv.business_name,
    cv.category as vendor_category,
    mt.subject as thread_subject,
    mt.thread_type,
    msi.search_vector,
    -- Rank for search relevance
    ts_rank(msi.search_vector, plainto_tsquery('english', '')) as search_rank
FROM vendor_messages vm
JOIN couple_vendors cv ON cv.id = vm.vendor_id
LEFT JOIN message_threads mt ON mt.id = vm.thread_id
LEFT JOIN message_search_index msi ON msi.message_id = vm.id;

-- View for attachment gallery
CREATE OR REPLACE VIEW attachment_gallery AS
SELECT 
    mm.id as media_id,
    mm.message_id,
    mm.media_type,
    mm.file_name,
    mm.file_size,
    mm.mime_type,
    mm.storage_path,
    mm.thumbnail_path,
    mm.width,
    mm.height,
    mm.duration,
    mm.uploaded_at,
    vm.vendor_id,
    vm.couple_id,
    vm.created_at as message_date,
    cv.name as vendor_name,
    cv.category as vendor_category,
    u.email as uploaded_by_email
FROM message_media mm
JOIN vendor_messages vm ON vm.id = mm.message_id
JOIN couple_vendors cv ON cv.id = vm.vendor_id
LEFT JOIN auth.users u ON u.id = mm.uploaded_by
ORDER BY mm.uploaded_at DESC;

-- View for upcoming scheduled messages
CREATE OR REPLACE VIEW upcoming_scheduled_messages AS
SELECT 
    sm.id as scheduled_message_id,
    sm.vendor_id,
    sm.couple_id,
    sm.thread_id,
    sm.content,
    sm.scheduled_for,
    sm.status,
    cv.name as vendor_name,
    cv.business_name,
    cv.category as vendor_category,
    mt.subject as thread_subject,
    -- Time until send
    EXTRACT(EPOCH FROM (sm.scheduled_for - CURRENT_TIMESTAMP))::INTEGER as seconds_until_send,
    CASE 
        WHEN sm.scheduled_for < CURRENT_TIMESTAMP THEN 'Overdue'
        WHEN sm.scheduled_for < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 'Very Soon'
        WHEN sm.scheduled_for < CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 'Today'
        WHEN sm.scheduled_for < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 'This Week'
        ELSE 'Later'
    END as send_timing
FROM scheduled_messages sm
JOIN couple_vendors cv ON cv.id = sm.vendor_id
LEFT JOIN message_threads mt ON mt.id = sm.thread_id
WHERE sm.status = 'pending'
ORDER BY sm.scheduled_for ASC;

-- View for vendor response analytics
CREATE OR REPLACE VIEW vendor_response_analytics AS
WITH response_times AS (
    SELECT 
        vm.vendor_id,
        vm.couple_id,
        vm.created_at as message_time,
        vm.sender_type,
        LEAD(vm.created_at) OVER (PARTITION BY vm.vendor_id ORDER BY vm.created_at) as next_message_time,
        LEAD(vm.sender_type) OVER (PARTITION BY vm.vendor_id ORDER BY vm.created_at) as next_sender_type
    FROM vendor_messages vm
)
SELECT 
    rt.vendor_id,
    rt.couple_id,
    cv.name as vendor_name,
    cv.category as vendor_category,
    COUNT(*) FILTER (WHERE rt.sender_type = 'couple' AND rt.next_sender_type = 'vendor') as vendor_responses,
    AVG(
        CASE 
            WHEN rt.sender_type = 'couple' AND rt.next_sender_type = 'vendor'
            THEN EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time))
        END
    )::INTEGER as avg_response_time_seconds,
    MIN(
        CASE 
            WHEN rt.sender_type = 'couple' AND rt.next_sender_type = 'vendor'
            THEN EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time))
        END
    )::INTEGER as fastest_response_seconds,
    MAX(
        CASE 
            WHEN rt.sender_type = 'couple' AND rt.next_sender_type = 'vendor'
            THEN EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time))
        END
    )::INTEGER as slowest_response_seconds,
    -- Response time brackets
    COUNT(*) FILTER (
        WHERE rt.sender_type = 'couple' 
        AND rt.next_sender_type = 'vendor'
        AND EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time)) < 3600
    ) as responses_within_hour,
    COUNT(*) FILTER (
        WHERE rt.sender_type = 'couple' 
        AND rt.next_sender_type = 'vendor'
        AND EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time)) < 86400
    ) as responses_within_day,
    COUNT(*) FILTER (
        WHERE rt.sender_type = 'couple' 
        AND rt.next_sender_type = 'vendor'
        AND EXTRACT(EPOCH FROM (rt.next_message_time - rt.message_time)) >= 86400
    ) as responses_after_day
FROM response_times rt
JOIN couple_vendors cv ON cv.id = rt.vendor_id
GROUP BY rt.vendor_id, rt.couple_id, cv.name, cv.category;

-- Create function to refresh materialized views if needed
CREATE OR REPLACE FUNCTION refresh_messaging_views()
RETURNS void AS $$
BEGIN
    -- Add any materialized view refreshes here if created in the future
    -- REFRESH MATERIALIZED VIEW CONCURRENTLY view_name;
    NULL; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- Grant permissions on views
GRANT SELECT ON conversation_summaries TO authenticated;
GRANT SELECT ON recent_conversations TO authenticated;
GRANT SELECT ON unread_by_category TO authenticated;
GRANT SELECT ON message_statistics TO authenticated;
GRANT SELECT ON thread_summaries TO authenticated;
GRANT SELECT ON vendor_communication_dashboard TO authenticated;
GRANT SELECT ON message_search_results TO authenticated;
GRANT SELECT ON attachment_gallery TO authenticated;
GRANT SELECT ON upcoming_scheduled_messages TO authenticated;
GRANT SELECT ON vendor_response_analytics TO authenticated;