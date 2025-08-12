-- KPI Views for SuperAdmin Dashboard

-- Active users view
CREATE OR REPLACE VIEW v_active_users AS
SELECT
  COUNT(DISTINCT CASE WHEN day >= CURRENT_DATE - INTERVAL '6 days' THEN user_id END) AS dau7,
  COUNT(DISTINCT CASE WHEN day >= CURRENT_DATE - INTERVAL '29 days' THEN user_id END) AS mau30,
  COUNT(DISTINCT CASE WHEN day >= CURRENT_DATE - INTERVAL '89 days' THEN user_id END) AS mau90
FROM usage_daily;

-- User segments view
CREATE OR REPLACE VIEW v_user_segments AS
SELECT
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT CASE WHEN s.status IN ('active','trialing') THEN u.id END) AS premium_users,
  COUNT(DISTINCT CASE WHEN s.status IS NULL OR s.status NOT IN ('active','trialing') THEN u.id END) AS free_users,
  COUNT(DISTINCT CASE WHEN s.status = 'trialing' THEN u.id END) AS trial_users,
  COUNT(DISTINCT CASE WHEN u.created_at >= CURRENT_DATE THEN u.id END) AS new_today,
  COUNT(DISTINCT CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '6 days' THEN u.id END) AS new_week,
  COUNT(DISTINCT CASE WHEN u.created_at >= CURRENT_DATE - INTERVAL '29 days' THEN u.id END) AS new_month
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status NOT IN ('canceled', 'incomplete');

-- Revenue view
CREATE OR REPLACE VIEW v_revenue AS
SELECT
  COALESCE(SUM(CASE 
    WHEN i.status = 'paid' AND DATE_TRUNC('month', i.paid_at) = DATE_TRUNC('month', CURRENT_DATE) 
    THEN i.amount_cents 
  END), 0) AS mrr_cents,
  COALESCE(SUM(CASE 
    WHEN i.status = 'paid' AND i.paid_at >= CURRENT_DATE - INTERVAL '29 days' 
    THEN i.amount_cents 
  END), 0) AS revenue_30d_cents,
  COALESCE(SUM(CASE 
    WHEN i.status = 'paid' AND i.paid_at >= CURRENT_DATE - INTERVAL '89 days' 
    THEN i.amount_cents 
  END), 0) AS revenue_90d_cents,
  COUNT(DISTINCT CASE 
    WHEN i.status = 'paid' AND DATE_TRUNC('month', i.paid_at) = DATE_TRUNC('month', CURRENT_DATE) 
    THEN i.user_id 
  END) AS paying_users_current_month
FROM invoices i;

-- Churn view
CREATE OR REPLACE VIEW v_churn AS
SELECT 
  COUNT(DISTINCT CASE 
    WHEN canceled_at >= CURRENT_DATE - INTERVAL '29 days' 
    THEN user_id 
  END) AS churned_30d,
  COUNT(DISTINCT CASE 
    WHEN canceled_at >= CURRENT_DATE - INTERVAL '89 days' 
    THEN user_id 
  END) AS churned_90d,
  COUNT(DISTINCT CASE 
    WHEN status = 'past_due' 
    THEN user_id 
  END) AS at_risk
FROM subscriptions;

-- Support view
CREATE OR REPLACE VIEW v_support_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_tickets,
  COUNT(*) FILTER (WHERE status = 'closed' AND created_at >= CURRENT_DATE - INTERVAL '29 days') AS closed_30d,
  COUNT(*) FILTER (WHERE priority = 'urgent' AND status != 'closed') AS urgent_open,
  COUNT(*) FILTER (WHERE priority = 'high' AND status != 'closed') AS high_open,
  AVG(CASE 
    WHEN status = 'closed' 
    THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
  END)::NUMERIC(10,2) AS avg_resolution_hours
FROM support_tickets;

-- Wedding-specific metrics
CREATE OR REPLACE VIEW v_wedding_metrics AS
SELECT
  COUNT(DISTINCT c.id) AS total_weddings,
  COUNT(DISTINCT CASE WHEN c.wedding_date >= CURRENT_DATE THEN c.id END) AS upcoming_weddings,
  COUNT(DISTINCT CASE WHEN c.wedding_date >= CURRENT_DATE AND c.wedding_date <= CURRENT_DATE + INTERVAL '30 days' THEN c.id END) AS weddings_next_30d,
  AVG(c.guest_count_estimate)::NUMERIC(10,0) AS avg_guest_count,
  AVG(c.total_budget)::NUMERIC(10,2) AS avg_budget,
  COUNT(DISTINCT g.id) AS total_guests,
  COUNT(DISTINCT CASE WHEN g.rsvp_status = 'confirmed' THEN g.id END) AS confirmed_guests,
  COUNT(DISTINCT v.id) AS total_vendors
FROM couples c
LEFT JOIN guests g ON g.couple_id = c.id
LEFT JOIN vendors v ON v.couple_id = c.id;

-- Usage trends view
CREATE OR REPLACE VIEW v_usage_trends AS
SELECT
  day,
  COUNT(DISTINCT user_id) AS active_users,
  SUM(files_uploaded) AS files_uploaded,
  SUM(storage_bytes) AS storage_bytes,
  SUM(api_calls) AS api_calls,
  SUM(guests_added) AS guests_added,
  SUM(invites_sent) AS invites_sent,
  SUM(rsvps_received) AS rsvps_received
FROM usage_daily
WHERE day >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- Top users by usage
CREATE OR REPLACE VIEW v_top_users_by_usage AS
SELECT
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  COALESCE(SUM(ud.storage_bytes), 0) AS total_storage_bytes,
  COALESCE(SUM(ud.api_calls), 0) AS total_api_calls,
  COALESCE(SUM(ud.files_uploaded), 0) AS total_files_uploaded,
  s.plan_id,
  s.status AS subscription_status
FROM users u
LEFT JOIN usage_daily ud ON ud.user_id = u.id AND ud.day >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing')
GROUP BY u.id, u.email, u.first_name, u.last_name, s.plan_id, s.status
ORDER BY total_storage_bytes DESC
LIMIT 100;