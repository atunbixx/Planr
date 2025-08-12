-- RBAC & Security Tables for SuperAdmin Dashboard

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superAdmin','admin','planner','vendor','guest')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Audit events table for tracking all admin actions
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

-- Plans table for subscription management
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  interval TEXT CHECK (interval IN ('month','year')) NOT NULL,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
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

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('paid','open','void','uncollectible','refunded')) NOT NULL,
  description TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at);

-- Daily usage rollups for analytics
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

-- Support tickets
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
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee ON support_tickets(assignee_user_id);

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type TEXT CHECK (author_type IN ('user','admin')) NOT NULL,
  author_user_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_author ON support_messages(author_user_id);

-- Feature flags for gradual rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);

-- Webhook logs for payment providers
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending','processed','failed')) DEFAULT 'pending',
  error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- Default plans
INSERT INTO plans (id, name, price_cents, interval, features) VALUES
  ('free', 'Free', 0, 'month', '{"guests": 50, "photos": 100, "vendors": 5}'::jsonb),
  ('basic', 'Basic', 999, 'month', '{"guests": 200, "photos": 500, "vendors": 20}'::jsonb),
  ('premium', 'Premium', 2999, 'month', '{"guests": 500, "photos": 2000, "vendors": -1}'::jsonb),
  ('enterprise', 'Enterprise', 9999, 'month', '{"guests": -1, "photos": -1, "vendors": -1}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Only superAdmins can access these tables
CREATE POLICY "SuperAdmins can view all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superAdmin'
    )
  );

CREATE POLICY "SuperAdmins can view all audit events" ON audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superAdmin'
    )
  );

-- Users can view their own tickets, admins can view all
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('superAdmin', 'admin')
    )
  );

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;