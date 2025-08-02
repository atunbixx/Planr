-- Helper functions for the messaging system

-- Function to send a message with automatic thread assignment
CREATE OR REPLACE FUNCTION send_vendor_message(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_sender_type VARCHAR(20),
    p_sender_id UUID DEFAULT NULL,
    p_sender_name VARCHAR(255) DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_message_type VARCHAR(20) DEFAULT 'text',
    p_thread_id UUID DEFAULT NULL,
    p_attachments JSONB DEFAULT '[]'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
    v_thread_id UUID;
BEGIN
    -- Determine thread ID
    IF p_thread_id IS NOT NULL THEN
        v_thread_id := p_thread_id;
    ELSE
        -- Try to find an open general thread
        SELECT id INTO v_thread_id
        FROM message_threads
        WHERE vendor_id = p_vendor_id
        AND couple_id = p_couple_id
        AND thread_type = 'general'
        AND status = 'open'
        ORDER BY updated_at DESC
        LIMIT 1;
        
        -- Create a new thread if none exists
        IF v_thread_id IS NULL THEN
            INSERT INTO message_threads (
                vendor_id,
                couple_id,
                thread_type,
                status
            ) VALUES (
                p_vendor_id,
                p_couple_id,
                'general',
                'open'
            ) RETURNING id INTO v_thread_id;
        END IF;
    END IF;
    
    -- Insert the message
    INSERT INTO vendor_messages (
        vendor_id,
        couple_id,
        sender_type,
        sender_id,
        sender_name,
        message_type,
        content,
        attachments,
        metadata,
        thread_id
    ) VALUES (
        p_vendor_id,
        p_couple_id,
        p_sender_type,
        p_sender_id,
        p_sender_name,
        p_message_type,
        p_content,
        p_attachments,
        p_metadata,
        v_thread_id
    ) RETURNING id INTO v_message_id;
    
    -- Update first message ID if this is the first message in thread
    UPDATE message_threads
    SET first_message_id = v_message_id
    WHERE id = v_thread_id
    AND first_message_id IS NULL;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new conversation thread
CREATE OR REPLACE FUNCTION create_message_thread(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_subject VARCHAR(255) DEFAULT NULL,
    p_thread_type VARCHAR(50) DEFAULT 'general',
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_thread_id UUID;
BEGIN
    INSERT INTO message_threads (
        vendor_id,
        couple_id,
        subject,
        thread_type,
        priority,
        metadata
    ) VALUES (
        p_vendor_id,
        p_couple_id,
        p_subject,
        p_thread_type,
        p_priority,
        p_metadata
    ) RETURNING id INTO v_thread_id;
    
    RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add media to a message
CREATE OR REPLACE FUNCTION add_message_media(
    p_message_id UUID,
    p_media_type VARCHAR(20),
    p_file_name VARCHAR(255),
    p_file_size BIGINT,
    p_storage_path TEXT,
    p_mime_type VARCHAR(100) DEFAULT NULL,
    p_thumbnail_path TEXT DEFAULT NULL,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_duration INTEGER DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_media_id UUID;
    v_display_order INTEGER;
BEGIN
    -- Get the next display order
    SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_display_order
    FROM message_media
    WHERE message_id = p_message_id;
    
    INSERT INTO message_media (
        message_id,
        media_type,
        file_name,
        file_size,
        mime_type,
        storage_path,
        thumbnail_path,
        width,
        height,
        duration,
        metadata,
        display_order,
        uploaded_by
    ) VALUES (
        p_message_id,
        p_media_type,
        p_file_name,
        p_file_size,
        p_mime_type,
        p_storage_path,
        p_thumbnail_path,
        p_width,
        p_height,
        p_duration,
        p_metadata,
        v_display_order,
        p_uploaded_by
    ) RETURNING id INTO v_media_id;
    
    RETURN v_media_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_vendor_messages(
    p_couple_id UUID,
    p_search_query TEXT,
    p_vendor_id UUID DEFAULT NULL,
    p_thread_id UUID DEFAULT NULL,
    p_sender_type VARCHAR(20) DEFAULT NULL,
    p_message_type VARCHAR(20) DEFAULT NULL,
    p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    message_id UUID,
    vendor_id UUID,
    vendor_name VARCHAR(255),
    thread_id UUID,
    thread_subject VARCHAR(255),
    sender_type VARCHAR(20),
    sender_name VARCHAR(255),
    message_type VARCHAR(20),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    search_rank REAL,
    highlight_content TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vm.id as message_id,
        vm.vendor_id,
        cv.name as vendor_name,
        vm.thread_id,
        mt.subject as thread_subject,
        vm.sender_type,
        vm.sender_name,
        vm.message_type,
        vm.content,
        vm.created_at,
        ts_rank(msi.search_vector, websearch_to_tsquery('english', p_search_query)) as search_rank,
        ts_headline(
            'english',
            vm.content,
            websearch_to_tsquery('english', p_search_query),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlight_content
    FROM vendor_messages vm
    JOIN couple_vendors cv ON cv.id = vm.vendor_id
    LEFT JOIN message_threads mt ON mt.id = vm.thread_id
    LEFT JOIN message_search_index msi ON msi.message_id = vm.id
    WHERE vm.couple_id = p_couple_id
    AND (p_vendor_id IS NULL OR vm.vendor_id = p_vendor_id)
    AND (p_thread_id IS NULL OR vm.thread_id = p_thread_id)
    AND (p_sender_type IS NULL OR vm.sender_type = p_sender_type)
    AND (p_message_type IS NULL OR vm.message_type = p_message_type)
    AND (p_date_from IS NULL OR vm.created_at >= p_date_from)
    AND (p_date_to IS NULL OR vm.created_at <= p_date_to)
    AND (
        p_search_query IS NULL 
        OR p_search_query = ''
        OR msi.search_vector @@ websearch_to_tsquery('english', p_search_query)
    )
    ORDER BY 
        CASE 
            WHEN p_search_query IS NOT NULL AND p_search_query != ''
            THEN ts_rank(msi.search_vector, websearch_to_tsquery('english', p_search_query))
            ELSE 0
        END DESC,
        vm.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_thread_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_before_message_id UUID DEFAULT NULL
)
RETURNS TABLE (
    message_id UUID,
    thread_id UUID,
    sender_type VARCHAR(20),
    sender_id UUID,
    sender_name VARCHAR(255),
    message_type VARCHAR(20),
    content TEXT,
    attachments JSONB,
    is_read BOOLEAN,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    media_count BIGINT,
    reactions JSONB
) AS $$
DECLARE
    v_before_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the timestamp of the before message if provided
    IF p_before_message_id IS NOT NULL THEN
        SELECT created_at INTO v_before_time
        FROM vendor_messages
        WHERE id = p_before_message_id;
    END IF;
    
    RETURN QUERY
    SELECT 
        vm.id as message_id,
        vm.thread_id,
        vm.sender_type,
        vm.sender_id,
        vm.sender_name,
        vm.message_type,
        vm.content,
        vm.attachments,
        vm.is_read,
        vm.read_at,
        vm.created_at,
        (SELECT COUNT(*) FROM message_media mm WHERE mm.message_id = vm.id) as media_count,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', mr.user_id,
                    'reaction', mr.reaction,
                    'created_at', mr.created_at
                )
            )
            FROM message_reactions mr
            WHERE mr.message_id = vm.id
        ) as reactions
    FROM vendor_messages vm
    WHERE vm.vendor_id = p_vendor_id
    AND vm.couple_id = p_couple_id
    AND (p_thread_id IS NULL OR vm.thread_id = p_thread_id)
    AND (v_before_time IS NULL OR vm.created_at < v_before_time)
    ORDER BY vm.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule a message
CREATE OR REPLACE FUNCTION schedule_vendor_message(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_content TEXT,
    p_scheduled_for TIMESTAMP WITH TIME ZONE,
    p_thread_id UUID DEFAULT NULL,
    p_template_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_scheduled_id UUID;
BEGIN
    -- Validate scheduled time is in the future
    IF p_scheduled_for <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Scheduled time must be in the future';
    END IF;
    
    INSERT INTO scheduled_messages (
        vendor_id,
        couple_id,
        thread_id,
        template_id,
        content,
        scheduled_for,
        metadata,
        created_by
    ) VALUES (
        p_vendor_id,
        p_couple_id,
        p_thread_id,
        p_template_id,
        p_content,
        p_scheduled_for,
        p_metadata,
        p_created_by
    ) RETURNING id INTO v_scheduled_id;
    
    RETURN v_scheduled_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process scheduled messages
CREATE OR REPLACE FUNCTION process_scheduled_messages()
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
    v_scheduled_message RECORD;
    v_message_id UUID;
BEGIN
    FOR v_scheduled_message IN 
        SELECT * FROM scheduled_messages
        WHERE status = 'pending'
        AND scheduled_for <= CURRENT_TIMESTAMP
        ORDER BY scheduled_for ASC
        LIMIT 100
    LOOP
        BEGIN
            -- Send the message
            v_message_id := send_vendor_message(
                p_vendor_id := v_scheduled_message.vendor_id,
                p_couple_id := v_scheduled_message.couple_id,
                p_sender_type := 'couple',
                p_sender_id := v_scheduled_message.created_by,
                p_content := v_scheduled_message.content,
                p_message_type := 'text',
                p_thread_id := v_scheduled_message.thread_id,
                p_metadata := jsonb_build_object('scheduled_message_id', v_scheduled_message.id)
            );
            
            -- Update scheduled message status
            UPDATE scheduled_messages
            SET 
                status = 'sent',
                sent_at = CURRENT_TIMESTAMP
            WHERE id = v_scheduled_message.id;
            
            v_processed_count := v_processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error and update status
            UPDATE scheduled_messages
            SET 
                status = 'failed',
                retry_count = retry_count + 1,
                error_details = SQLERRM
            WHERE id = v_scheduled_message.id;
        END;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to add reaction to message
CREATE OR REPLACE FUNCTION toggle_message_reaction(
    p_message_id UUID,
    p_user_id UUID,
    p_user_type VARCHAR(20),
    p_reaction VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if reaction already exists
    SELECT EXISTS(
        SELECT 1 FROM message_reactions
        WHERE message_id = p_message_id
        AND user_id = p_user_id
        AND reaction = p_reaction
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove reaction
        DELETE FROM message_reactions
        WHERE message_id = p_message_id
        AND user_id = p_user_id
        AND reaction = p_reaction;
        
        RETURN FALSE; -- Reaction removed
    ELSE
        -- Add reaction
        INSERT INTO message_reactions (
            message_id,
            user_id,
            user_type,
            reaction
        ) VALUES (
            p_message_id,
            p_user_id,
            p_user_type,
            p_reaction
        );
        
        RETURN TRUE; -- Reaction added
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor communication stats
CREATE OR REPLACE FUNCTION get_vendor_communication_stats(
    p_couple_id UUID,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_vendors INTEGER,
    vendors_messaged INTEGER,
    total_messages BIGINT,
    messages_sent BIGINT,
    messages_received BIGINT,
    unread_messages BIGINT,
    avg_response_time_hours NUMERIC,
    most_active_vendor_id UUID,
    most_active_vendor_name VARCHAR(255),
    most_active_vendor_messages BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(DISTINCT cv.id) as total_vendors,
            COUNT(DISTINCT vm.vendor_id) as vendors_messaged,
            COUNT(vm.id) as total_messages,
            COUNT(vm.id) FILTER (WHERE vm.sender_type = 'couple') as messages_sent,
            COUNT(vm.id) FILTER (WHERE vm.sender_type = 'vendor') as messages_received,
            COUNT(vm.id) FILTER (WHERE vm.is_read = false AND vm.sender_type != 'couple') as unread_messages
        FROM couple_vendors cv
        LEFT JOIN vendor_messages vm ON vm.vendor_id = cv.id
            AND (p_date_from IS NULL OR vm.created_at::date >= p_date_from)
            AND (p_date_to IS NULL OR vm.created_at::date <= p_date_to)
        WHERE cv.couple_id = p_couple_id
    ),
    response_times AS (
        SELECT AVG(avg_vendor_response_time_seconds) / 3600.0 as avg_response_time_hours
        FROM vendor_response_analytics
        WHERE couple_id = p_couple_id
    ),
    most_active AS (
        SELECT 
            vm.vendor_id,
            cv.name as vendor_name,
            COUNT(*) as message_count
        FROM vendor_messages vm
        JOIN couple_vendors cv ON cv.id = vm.vendor_id
        WHERE vm.couple_id = p_couple_id
            AND (p_date_from IS NULL OR vm.created_at::date >= p_date_from)
            AND (p_date_to IS NULL OR vm.created_at::date <= p_date_to)
        GROUP BY vm.vendor_id, cv.name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.total_vendors::INTEGER,
        s.vendors_messaged::INTEGER,
        s.total_messages,
        s.messages_sent,
        s.messages_received,
        s.unread_messages,
        ROUND(rt.avg_response_time_hours, 1),
        ma.vendor_id as most_active_vendor_id,
        ma.vendor_name as most_active_vendor_name,
        ma.message_count as most_active_vendor_messages
    FROM stats s
    CROSS JOIN response_times rt
    LEFT JOIN most_active ma ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old typing indicators (scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    UPDATE typing_indicators
    SET is_typing = false
    WHERE is_typing = true
    AND last_typed_at < CURRENT_TIMESTAMP - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to apply message template
CREATE OR REPLACE FUNCTION apply_message_template(
    p_template_id UUID,
    p_variables JSONB DEFAULT '{}'::jsonb
)
RETURNS TEXT AS $$
DECLARE
    v_template RECORD;
    v_content TEXT;
    v_var RECORD;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM message_templates
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    v_content := v_template.content;
    
    -- Replace variables
    FOR v_var IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_content := REPLACE(v_content, '{{' || v_var.key || '}}', v_var.value);
    END LOOP;
    
    RETURN v_content;
END;
$$ LANGUAGE plpgsql;