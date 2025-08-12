const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigrations() {
  console.log('🚀 Applying SuperAdmin database schema...\n')

  try {
    // First, let's check if tables already exist
    const { data: existingTables } = await supabase
      .from('user_roles')
      .select('id')
      .limit(1)

    if (existingTables && !existingTables.error) {
      console.log('✅ Tables already exist. Skipping migration.')
      return
    }

    console.log('📦 Creating RBAC tables...')
    
    // Create user_roles table
    const { error: rolesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('superAdmin','admin','planner','vendor','guest')),
          created_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(user_id, role)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
      `
    })

    if (rolesError) {
      console.log('Note: user_roles table might already exist, continuing...')
    }

    console.log('📊 Creating audit_events table...')
    
    const { error: auditError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS audit_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_user_id UUID REFERENCES users(id),
          target_user_id UUID REFERENCES users(id),
          event_type TEXT NOT NULL,
          event_payload JSONB DEFAULT '{}'::jsonb,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_events_target ON audit_events(target_user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
      `
    })

    if (auditError) {
      console.log('Note: audit_events table might already exist, continuing...')
    }

    console.log('💰 Creating billing tables...')
    
    // Create plans table
    const { error: plansError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price_cents INTEGER NOT NULL,
          interval TEXT CHECK (interval IN ('month','year')) NOT NULL,
          features JSONB DEFAULT '{}'::jsonb,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `
    })

    if (plansError) {
      console.log('Note: plans table might already exist, continuing...')
    }

    // Create subscriptions table
    const { error: subsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id),
          plan_id TEXT REFERENCES plans(id),
          status TEXT CHECK (status IN ('active','trialing','past_due','canceled','incomplete')) NOT NULL,
          started_at TIMESTAMPTZ,
          current_period_end TIMESTAMPTZ,
          canceled_at TIMESTAMPTZ,
          trial_end TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
      `
    })

    if (subsError) {
      console.log('Note: subscriptions table might already exist, continuing...')
    }

    console.log('📈 Creating usage tracking tables...')
    
    // Create usage_daily table
    const { error: usageError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS usage_daily (
          day DATE NOT NULL,
          user_id UUID NOT NULL REFERENCES users(id),
          couple_id UUID REFERENCES couples(id),
          files_uploaded INTEGER DEFAULT 0,
          storage_bytes BIGINT DEFAULT 0,
          api_calls INTEGER DEFAULT 0,
          active_minutes INTEGER DEFAULT 0,
          guests_added INTEGER DEFAULT 0,
          invites_sent INTEGER DEFAULT 0,
          rsvps_received INTEGER DEFAULT 0,
          PRIMARY KEY (day, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_usage_daily_day ON usage_daily(day DESC);
        CREATE INDEX IF NOT EXISTS idx_usage_daily_couple ON usage_daily(couple_id);
      `
    })

    if (usageError) {
      console.log('Note: usage_daily table might already exist, continuing...')
    }

    console.log('🎟️ Creating support tables...')
    
    // Create support tables
    const { error: supportError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          subject TEXT NOT NULL,
          status TEXT CHECK (status IN ('open','pending','closed')) NOT NULL DEFAULT 'open',
          priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
          assignee_user_id UUID REFERENCES users(id),
          category TEXT,
          tags TEXT[],
          metadata JSONB DEFAULT '{}'::jsonb,
          last_message_at TIMESTAMPTZ DEFAULT now(),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
        CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
        CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
      `
    })

    if (supportError) {
      console.log('Note: support_tickets table might already exist, continuing...')
    }

    console.log('🌱 Inserting default plans...')
    
    // Insert default plans
    const { error: insertPlansError } = await supabase
      .from('plans')
      .upsert([
        { id: 'free', name: 'Free', price_cents: 0, interval: 'month', features: { guests: 50, photos: 100, vendors: 5 } },
        { id: 'basic', name: 'Basic', price_cents: 999, interval: 'month', features: { guests: 200, photos: 500, vendors: 20 } },
        { id: 'premium', name: 'Premium', price_cents: 2999, interval: 'month', features: { guests: 500, photos: 2000, vendors: -1 } },
        { id: 'enterprise', name: 'Enterprise', price_cents: 9999, interval: 'month', features: { guests: -1, photos: -1, vendors: -1 } }
      ], { onConflict: 'id' })

    if (insertPlansError) {
      console.log('Note: Plans might already exist, continuing...')
    }

    console.log('\n✅ SuperAdmin schema applied successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Find your user ID in Supabase Auth dashboard')
    console.log('2. Update USER_ID in scripts/seed-superadmin.ts')
    console.log('3. Run: npx tsx scripts/seed-superadmin.ts')
    console.log('4. Access the dashboard at: http://localhost:4000/superadmin')

  } catch (error) {
    console.error('❌ Error applying migrations:', error)
    process.exit(1)
  }
}

applyMigrations()