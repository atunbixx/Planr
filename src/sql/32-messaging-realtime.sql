-- Real-time messaging support with Supabase Realtime
-- Enables live updates for messages, typing indicators, and read receipts

-- Create publication for real-time updates if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE vendor_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE message_threads;

-- Function to broadcast new messages
CREATE OR REPLACE FUNCTION broadcast_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update thread last activity in real-time
    IF NEW.thread_id IS NOT NULL THEN
        UPDATE message_threads
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.thread_id;
    END IF;
    
    -- Notify about unread count change
    PERFORM pg_notify(
        'vendor_unread_change',
        json_build_object(
            'vendor_id', NEW.vendor_id,
            'couple_id', NEW.couple_id,
            'action', 'increment'
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to broadcast read status changes
CREATE OR REPLACE FUNCTION broadcast_read_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_read = false AND NEW.is_read = true THEN
        -- Notify about read status change
        PERFORM pg_notify(
            'message_read',
            json_build_object(
                'message_id', NEW.id,
                'vendor_id', NEW.vendor_id,
                'couple_id', NEW.couple_id,
                'read_at', NEW.read_at
            )::text
        );
        
        -- Update unread count notification
        PERFORM pg_notify(
            'vendor_unread_change',
            json_build_object(
                'vendor_id', NEW.vendor_id,
                'couple_id', NEW.couple_id,
                'action', 'decrement'
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle typing indicator updates
CREATE OR REPLACE FUNCTION handle_typing_indicator()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast typing status change
    PERFORM pg_notify(
        'typing_status',
        json_build_object(
            'vendor_id', NEW.vendor_id,
            'couple_id', NEW.couple_id,
            'user_id', NEW.user_id,
            'is_typing', NEW.is_typing,
            'user_type', NEW.user_type
        )::text
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for real-time updates
DROP TRIGGER IF EXISTS broadcast_new_message_trigger ON vendor_messages;
CREATE TRIGGER broadcast_new_message_trigger
    AFTER INSERT ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_new_message();

DROP TRIGGER IF EXISTS broadcast_read_status_trigger ON vendor_messages;
CREATE TRIGGER broadcast_read_status_trigger
    AFTER UPDATE OF is_read ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_read_status();

DROP TRIGGER IF EXISTS handle_typing_indicator_trigger ON typing_indicators;
CREATE TRIGGER handle_typing_indicator_trigger
    AFTER INSERT OR UPDATE ON typing_indicators
    FOR EACH ROW
    EXECUTE FUNCTION handle_typing_indicator();

-- Function to set typing status
CREATE OR REPLACE FUNCTION set_typing_status(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_user_id UUID,
    p_user_type VARCHAR(20),
    p_is_typing BOOLEAN
)
RETURNS void AS $$
BEGIN
    INSERT INTO typing_indicators (
        vendor_id,
        couple_id,
        user_id,
        user_type,
        is_typing,
        last_typed_at
    ) VALUES (
        p_vendor_id,
        p_couple_id,
        p_user_id,
        p_user_type,
        p_is_typing,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (vendor_id, couple_id, user_id)
    DO UPDATE SET
        is_typing = p_is_typing,
        last_typed_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to get current typing users
CREATE OR REPLACE FUNCTION get_typing_users(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_type VARCHAR(20),
    is_typing BOOLEAN,
    seconds_since_typed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.user_id,
        ti.user_type,
        ti.is_typing,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ti.last_typed_at))::INTEGER as seconds_since_typed
    FROM typing_indicators ti
    WHERE ti.vendor_id = p_vendor_id
    AND ti.couple_id = p_couple_id
    AND ti.is_typing = true
    AND ti.last_typed_at > CURRENT_TIMESTAMP - INTERVAL '30 seconds'
    AND (p_exclude_user_id IS NULL OR ti.user_id != p_exclude_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function for presence tracking
CREATE OR REPLACE FUNCTION update_user_presence(
    p_user_id UUID,
    p_vendor_id UUID,
    p_couple_id UUID
)
RETURNS void AS $$
BEGIN
    -- Update last seen for messaging context
    UPDATE couple_vendors
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = p_vendor_id
    AND couple_id = p_couple_id;
    
    -- Broadcast presence update
    PERFORM pg_notify(
        'user_presence',
        json_build_object(
            'user_id', p_user_id,
            'vendor_id', p_vendor_id,
            'couple_id', p_couple_id,
            'timestamp', CURRENT_TIMESTAMP
        )::text
    );
END;
$$ LANGUAGE plpgsql;

-- Create channel for vendor-specific updates
CREATE OR REPLACE FUNCTION create_vendor_channel(
    p_vendor_id UUID,
    p_couple_id UUID
)
RETURNS TEXT AS $$
BEGIN
    RETURN 'vendor_' || p_vendor_id || '_couple_' || p_couple_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time message updates
CREATE OR REPLACE FUNCTION get_realtime_message_updates(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_since TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    update_type VARCHAR(50),
    message_id UUID,
    thread_id UUID,
    content TEXT,
    sender_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN,
    reactions JSONB,
    media_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'new_message' as update_type,
        vm.id as message_id,
        vm.thread_id,
        vm.content,
        vm.sender_type,
        vm.created_at,
        vm.is_read,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', mr.user_id,
                    'reaction', mr.reaction
                )
            )
            FROM message_reactions mr
            WHERE mr.message_id = vm.id
        ) as reactions,
        (SELECT COUNT(*) FROM message_media mm WHERE mm.message_id = vm.id) as media_count
    FROM vendor_messages vm
    WHERE vm.vendor_id = p_vendor_id
    AND vm.couple_id = p_couple_id
    AND (p_since IS NULL OR vm.created_at > p_since)
    ORDER BY vm.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to batch mark messages as delivered
CREATE OR REPLACE FUNCTION mark_messages_delivered(
    p_message_ids UUID[],
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    -- This could be extended to track delivery status per recipient
    -- For now, we'll use read status as a proxy
    UPDATE vendor_messages
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ANY(p_message_ids)
    AND sender_id != p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for real-time performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_realtime 
    ON vendor_messages(vendor_id, couple_id, created_at DESC)
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_typing_indicators_realtime
    ON typing_indicators(vendor_id, couple_id, last_typed_at DESC)
    WHERE is_typing = true;

-- Cleanup function for old real-time data
CREATE OR REPLACE FUNCTION cleanup_old_realtime_data()
RETURNS void AS $$
BEGIN
    -- Clean up old typing indicators
    DELETE FROM typing_indicators
    WHERE last_typed_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';
    
    -- Clean up orphaned message search index entries
    DELETE FROM message_search_index
    WHERE message_id NOT IN (SELECT id FROM vendor_messages);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- This is commented out as pg_cron might not be available
-- SELECT cron.schedule('cleanup-realtime-data', '0 * * * *', 'SELECT cleanup_old_realtime_data();');