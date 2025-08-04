import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const createTablesSQL = `
-- Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
  subject VARCHAR(500),
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Logs Table
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('email', 'sms', 'whatsapp')),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('guest', 'vendor')),
  recipient_id UUID,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  subject VARCHAR(500),
  body TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  variables JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
  external_id VARCHAR(100),
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Messages Table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('email', 'sms', 'whatsapp')),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('guest', 'vendor')),
  recipient_ids UUID[] NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  template_id UUID REFERENCES message_templates(id),
  variables JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Preferences Table
CREATE TABLE IF NOT EXISTS message_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('email', 'sms', 'whatsapp')),
  contact_value VARCHAR(255) NOT NULL,
  opted_in BOOLEAN DEFAULT true,
  unsubscribe_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_id, contact_type, contact_value)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_logs_couple_id ON message_logs(couple_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_external_id ON message_logs(external_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_couple_id ON message_templates(couple_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_system ON message_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_couple_id ON scheduled_messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);

-- RLS Policies
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for message_templates
CREATE POLICY "Users can view system templates and their own templates" ON message_templates
  FOR SELECT USING (is_system = true OR couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own templates" ON message_templates
  FOR INSERT WITH CHECK (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own templates" ON message_templates
  FOR UPDATE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ) AND is_system = false);

CREATE POLICY "Users can delete their own templates" ON message_templates
  FOR DELETE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ) AND is_system = false);

-- Policies for message_logs
CREATE POLICY "Users can view their own message logs" ON message_logs
  FOR SELECT USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own message logs" ON message_logs
  FOR INSERT WITH CHECK (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own message logs" ON message_logs
  FOR UPDATE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

-- Policies for scheduled_messages
CREATE POLICY "Users can view their own scheduled messages" ON scheduled_messages
  FOR SELECT USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own scheduled messages" ON scheduled_messages
  FOR INSERT WITH CHECK (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own scheduled messages" ON scheduled_messages
  FOR UPDATE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own scheduled messages" ON scheduled_messages
  FOR DELETE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

-- Policies for message_preferences
CREATE POLICY "Users can view their own message preferences" ON message_preferences
  FOR SELECT USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own message preferences" ON message_preferences
  FOR INSERT WITH CHECK (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own message preferences" ON message_preferences
  FOR UPDATE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own message preferences" ON message_preferences
  FOR DELETE USING (couple_id IN (
    SELECT id FROM couples WHERE user_id = auth.uid()
  ));
`;

const systemTemplates = [
  {
    name: 'Guest Invitation - Email',
    description: 'Formal wedding invitation email',
    type: 'email',
    subject: 'You\'re Invited! {{partner1Name}} & {{partner2Name}}\'s Wedding',
    body: `Dear {{guestName}},

We're thrilled to invite you to celebrate our special day!

{{partner1Name}} & {{partner2Name}}
are getting married on {{weddingDate}}
at {{venueName}}
{{venueAddress}}

Please RSVP by {{rsvpDeadline}} at: {{rsvpLink}}

We can't wait to celebrate with you!

With love,
{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'venueName', 'venueAddress', 'rsvpDeadline', 'rsvpLink'],
    is_system: true,
    category: 'invitation'
  },
  {
    name: 'Guest Invitation - SMS',
    description: 'Wedding invitation text message',
    type: 'sms',
    subject: null,
    body: 'Hi {{guestName}}! {{partner1Name}} & {{partner2Name}} are getting married on {{weddingDate}} at {{venueName}}. Please RSVP: {{rsvpLink}}',
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'venueName', 'rsvpLink'],
    is_system: true,
    category: 'invitation'
  },
  {
    name: 'RSVP Reminder - Email',
    description: 'Friendly reminder for guests to RSVP',
    type: 'email',
    subject: 'RSVP Reminder - {{partner1Name}} & {{partner2Name}}\'s Wedding',
    body: `Hi {{guestName}},

We hope you received our wedding invitation! We're excited to celebrate with you on {{weddingDate}}.

We haven't received your RSVP yet and would love to know if you can join us. Please respond by {{rsvpDeadline}}.

RSVP here: {{rsvpLink}}

Thank you!
{{partner1Name}} & {{partner2Name}}`,
    variables: ['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'rsvpDeadline', 'rsvpLink'],
    is_system: true,
    category: 'reminder'
  },
  {
    name: 'Vendor Confirmation',
    description: 'Confirmation for vendor services',
    type: 'email',
    subject: 'Wedding Service Confirmed - {{weddingDate}}',
    body: `Dear {{vendorName}},

Thank you for confirming your services for our wedding!

Event Details:
- Date: {{weddingDate}}
- Time: {{serviceTime}}
- Venue: {{venueName}}

Service: {{serviceType}}

We'll be in touch with final details.

Best regards,
{{partner1Name}} & {{partner2Name}}`,
    variables: ['vendorName', 'weddingDate', 'serviceTime', 'venueName', 'serviceType', 'partner1Name', 'partner2Name'],
    is_system: true,
    category: 'confirmation'
  }
];

async function createMessageTables() {
  try {
    console.log('🔌 Creating message tables...');
    
    // Execute the SQL to create tables
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    });
    
    if (sqlError) {
      // Try direct query execution
      console.log('Trying direct query execution...');
      const { error: directError } = await supabase
        .from('message_templates')
        .select('count')
        .limit(1);
      
      if (directError?.code === '42P01') {
        console.log('❌ Tables do not exist. Please run the SQL manually in Supabase SQL Editor.');
        console.log('📋 SQL to run:');
        console.log(createTablesSQL);
        return;
      }
    }
    
    console.log('✅ Tables created or already exist');
    
    // Insert system templates
    console.log('🌱 Inserting system templates...');
    
    for (const template of systemTemplates) {
      const { error } = await supabase
        .from('message_templates')
        .upsert(template, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        });
        
      if (error) {
        console.log(`⚠️  Could not insert template ${template.name}:`, error.message);
      } else {
        console.log(`✅ Inserted template: ${template.name}`);
      }
    }
    
    console.log('🎉 Message system setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up message system:', error);
  }
}

createMessageTables();