-- Create function to send vendor messages with proper thread management
CREATE OR REPLACE FUNCTION send_vendor_message(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_sender_type TEXT,
    p_sender_id UUID,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text',
    p_thread_id UUID DEFAULT NULL,
    p_attachments JSONB DEFAULT '[]'::jsonb,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_thread_id UUID;
    v_message_id UUID;
    v_sender_name TEXT;
BEGIN
    -- Get sender name
    IF p_sender_type = 'couple' THEN
        SELECT COALESCE(u.raw_user_meta_data->>'full_name', u.email)
        INTO v_sender_name
        FROM auth.users u
        WHERE u.id = p_sender_id;
    ELSE
        SELECT name
        INTO v_sender_name
        FROM vendors
        WHERE user_id = p_sender_id;
    END IF;

    -- Get or create thread
    IF p_thread_id IS NOT NULL THEN
        v_thread_id := p_thread_id;
    ELSE
        -- Check if thread exists
        SELECT id INTO v_thread_id
        FROM message_threads
        WHERE couple_id = p_couple_id 
        AND vendor_id = p_vendor_id
        LIMIT 1;
        
        -- Create thread if it doesn't exist
        IF v_thread_id IS NULL THEN
            INSERT INTO message_threads (couple_id, vendor_id)
            VALUES (p_couple_id, p_vendor_id)
            RETURNING id INTO v_thread_id;
        END IF;
    END IF;

    -- Insert message
    INSERT INTO vendor_messages (
        thread_id,
        couple_id,
        vendor_id,
        content,
        message_type,
        sender_type,
        sender_user_id,
        sender_name,
        status,
        sent_at,
        metadata
    ) VALUES (
        v_thread_id,
        p_couple_id,
        p_vendor_id,
        p_content,
        p_message_type,
        p_sender_type,
        p_sender_id,
        v_sender_name,
        'sent',
        CURRENT_TIMESTAMP,
        p_metadata
    ) RETURNING id INTO v_message_id;

    -- Handle attachments if provided
    IF jsonb_array_length(p_attachments) > 0 THEN
        INSERT INTO message_attachments (
            message_id,
            filename,
            file_size,
            mime_type,
            storage_path
        )
        SELECT 
            v_message_id,
            (attachment->>'name')::VARCHAR(255),
            (attachment->>'size')::INTEGER,
            (attachment->>'type')::VARCHAR(100),
            (attachment->>'url')::VARCHAR(500)
        FROM jsonb_array_elements(p_attachments) AS attachment;
    END IF;

    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_vendor_message TO authenticated;