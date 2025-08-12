-- Complete SuperAdmin Setup Script
-- Run this entire script in Supabase SQL Editor to set up all SuperAdmin tables

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('superAdmin','admin','planner','vendor','guest')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 2. Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
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

-- 3. Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  interval TEXT CHECK (interval IN ('month','year')) NOT NULL,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

-- 5. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

-- 6. Create usage_daily table
CREATE TABLE IF NOT EXISTS usage_daily (
  day DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

-- 7. Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  status TEXT CHECK (status IN ('open','pending','closed')) NOT NULL DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
  assignee_user_id UUID REFERENCES auth.users(id),
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

-- 8. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_type TEXT CHECK (author_type IN ('user','admin')) NOT NULL,
  author_user_id UUID REFERENCES auth.users(id),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_author ON support_messages(author_user_id);

-- 9. Insert default plans
INSERT INTO plans (id, name, price_cents, interval, features) VALUES
  ('free', 'Free', 0, 'month', '{"guests": 50, "photos": 100, "vendors": 5}'::jsonb),
  ('basic', 'Basic', 999, 'month', '{"guests": 200, "photos": 500, "vendors": 20}'::jsonb),
  ('premium', 'Premium', 2999, 'month', '{"guests": 500, "photos": 2000, "vendors": -1}'::jsonb),
  ('enterprise', 'Enterprise', 9999, 'month', '{"guests": -1, "photos": -1, "vendors": -1}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. Enable RLS on sensitive tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies
-- Only superAdmins can view/modify user_roles
CREATE POLICY "SuperAdmins can view all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superAdmin'
    )
  );

-- Only superAdmins can view audit events
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

-- 12. Create necessary views for KPIs
CREATE OR REPLACE VIEW kpi_acquisition AS
SELECT 
  COUNT(CASE WHEN u.created_at >= CURRENT_DATE THEN 1 END) as new_today,
  COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_week,
  COUNT(CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_month
FROM auth.users u;

CREATE OR REPLACE VIEW kpi_engagement AS
SELECT 
  COUNT(DISTINCT CASE WHEN ud.day >= CURRENT_DATE - INTERVAL '7 days' THEN ud.user_id END) as dau7,
  COUNT(DISTINCT CASE WHEN ud.day >= CURRENT_DATE - INTERVAL '30 days' THEN ud.user_id END) as mau30,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN ud.day >= CURRENT_DATE - INTERVAL '30 days' THEN ud.user_id END) > 0
    THEN ROUND(
      COUNT(DISTINCT CASE WHEN ud.day >= CURRENT_DATE - INTERVAL '7 days' THEN ud.user_id END)::numeric / 
      COUNT(DISTINCT CASE WHEN ud.day >= CURRENT_DATE - INTERVAL '30 days' THEN ud.user_id END) * 100
    )
    ELSE 0
  END as stickiness
FROM usage_daily ud;

CREATE OR REPLACE VIEW kpi_revenue AS
SELECT 
  COALESCE(SUM(CASE WHEN s.status = 'active' THEN p.price_cents ELSE 0 END), 0) as mrr_cents,
  COALESCE(SUM(CASE WHEN i.paid_at >= CURRENT_DATE - INTERVAL '30 days' THEN i.amount_cents ELSE 0 END), 0) as revenue_30d_cents,
  COALESCE(SUM(CASE WHEN i.paid_at >= CURRENT_DATE - INTERVAL '90 days' THEN i.amount_cents ELSE 0 END), 0) as revenue_90d_cents,
  COUNT(DISTINCT CASE WHEN s.status = 'active' AND p.price_cents > 0 THEN s.user_id END) as paying_users
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id
LEFT JOIN invoices i ON s.user_id = i.user_id;

CREATE OR REPLACE VIEW kpi_churn AS
SELECT 
  COUNT(CASE WHEN s.canceled_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as churned_30d,
  COUNT(CASE WHEN s.canceled_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as churned_90d,
  COUNT(CASE 
    WHEN s.status = 'active' 
    AND s.current_period_end < CURRENT_DATE + INTERVAL '7 days'
    THEN 1 
  END) as at_risk
FROM subscriptions s;

CREATE OR REPLACE VIEW kpi_support AS
SELECT 
  COUNT(CASE WHEN st.status = 'open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN st.status = 'pending' THEN 1 END) as pending_tickets,
  COUNT(CASE WHEN st.status = 'closed' AND st.updated_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as closed_30d,
  COUNT(CASE WHEN st.status = 'open' AND st.priority = 'urgent' THEN 1 END) as urgent_open,
  COUNT(CASE WHEN st.status = 'open' AND st.priority = 'high' THEN 1 END) as high_open
FROM support_tickets st;

-- 13. Show current auth users to help find your ID
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- IMPORTANT: After running this script, note your user ID from the output above
-- Then run this command with your actual user ID:
-- INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'superAdmin');