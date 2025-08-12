# SuperAdmin SaaS Control Center

A comprehensive admin dashboard for managing your Wedding Planner SaaS application.

## 🚀 Quick Start

### 1. Run Database Migrations

```bash
# Run the RBAC and KPI migrations
npx prisma migrate deploy

# Or if in development:
npx prisma migrate dev
```

### 2. Grant SuperAdmin Access

```bash
# Update the USER_ID in the script with your actual user ID
npm run seed:superadmin

# Or run manually:
npx tsx scripts/seed-superadmin.ts
```

To find your user ID:
1. Go to Supabase dashboard → Authentication → Users
2. Find your email and copy the User UID
3. Update `USER_ID` in `scripts/seed-superadmin.ts`

### 3. Access the Dashboard

Navigate to: `http://localhost:4000/superadmin`

## 🎯 Features

### Overview Dashboard
- **Real-time KPIs**: MRR, active users, churn rate, new signups
- **Revenue charts**: Monthly trends, growth metrics
- **User segments**: Free vs premium, trial users
- **System health**: Error rates, support queue, performance metrics
- **Wedding metrics**: Upcoming weddings, average guest counts

### User Management
- **Search & filter**: By email, plan, subscription status
- **User profiles**: Detailed view with usage, invoices, activity
- **Actions**: Change plans, grant credits, suspend/reactivate accounts
- **Impersonation**: View the app as any user (read-only by default)

### Revenue Analytics
- **MRR/ARR tracking**: Real-time subscription revenue
- **Invoice management**: View all payments, failed charges, refunds
- **Plan distribution**: Revenue breakdown by subscription tier
- **Top customers**: Highest paying users with lifetime value

### Usage Monitoring
- **Storage tracking**: Files uploaded, total storage per user
- **API usage**: Calls per user, rate limiting insights
- **Activity trends**: Daily/weekly/monthly active users
- **Resource alerts**: High usage warnings

### Support Center
- **Ticket queue**: Open/pending/closed tickets with SLA tracking
- **Priority management**: Urgent and high priority ticket alerts
- **Assignment**: Route tickets to team members
- **Response metrics**: Average resolution time

### Audit Trail
- **Admin actions**: Every modification logged with actor/target/timestamp
- **Security events**: Login attempts, permission changes
- **Data changes**: Plan modifications, credits, suspensions
- **Compliance**: Full audit trail for regulatory requirements

## 🏗️ Architecture

### Database Schema

```sql
-- Core tables added
- user_roles: RBAC system
- audit_events: Complete audit trail
- plans: Subscription plans
- subscriptions: User subscriptions
- invoices: Payment records
- usage_daily: Usage analytics
- support_tickets: Support system
- support_messages: Ticket threads
- feature_flags: Gradual rollouts
- webhook_logs: Payment provider webhooks
```

### Security

- **Role-based access**: Only users with `superAdmin` role can access
- **Row Level Security**: Database-level protection
- **Audit logging**: Every admin action is logged
- **Server-side validation**: All checks happen on the server

### API Endpoints

```
GET    /api/admin/overview      - Dashboard KPIs
GET    /api/admin/users         - User list with filters
GET    /api/admin/users/:id     - User details
PUT    /api/admin/users/:id     - Update user (plan, credits, etc)
GET    /api/admin/revenue       - Revenue analytics
GET    /api/admin/usage         - Usage statistics
GET    /api/admin/support       - Support tickets
POST   /api/admin/support/:id   - Reply to ticket
GET    /api/admin/events        - Audit events
```

## 🛠️ Configuration

### Environment Variables

No additional environment variables needed - uses existing Supabase configuration.

### Feature Flags

Control feature rollouts from the Settings page:
- Enable/disable features by plan
- Percentage-based rollouts
- User-specific overrides

### Webhook Setup

For payment processing, configure webhooks at:
- Stripe: `/api/webhooks/stripe`
- Paystack: `/api/webhooks/paystack` (if using)
- Flutterwave: `/api/webhooks/flutterwave` (if using)

## 📊 KPI Definitions

### Acquisition Metrics
- **New Users**: Signups in last 24h/7d/30d
- **Activation Rate**: % completing first key action within 7 days
- **Source Attribution**: Where users come from

### Engagement Metrics
- **DAU/MAU**: Daily/Monthly Active Users
- **Stickiness**: DAU/MAU ratio
- **Feature Adoption**: % using key features

### Revenue Metrics
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue (MRR × 12)
- **ARPU**: Average Revenue Per User
- **LTV**: Simple lifetime value (ARPU × 24 months)

### Retention Metrics
- **Churn Rate**: Customers lost / total customers
- **Logo Churn**: Count of churned customers
- **Revenue Churn**: MRR lost from churn
- **At Risk**: Customers with past_due status

## 🚨 Monitoring & Alerts

### System Alerts (Coming Soon)
- Payment failures spike
- Sudden churn increase
- Storage usage surge
- Error rate threshold
- Support SLA breach

### Performance Monitoring
- API response times
- Database query performance
- Storage growth trends
- Webhook delivery success

## 🔧 Maintenance

### Daily Tasks
- Check support queue
- Review failed payments
- Monitor error rates

### Weekly Tasks
- Review user growth
- Check revenue trends
- Analyze churn reasons
- Update feature flags

### Monthly Tasks
- Generate investor reports
- Review top customers
- Plan feature rollouts
- Audit security logs

## 📚 Advanced Usage

### Custom KPIs

Add new KPIs by creating SQL views:

```sql
CREATE OR REPLACE VIEW v_custom_metric AS
SELECT 
  COUNT(*) as total,
  -- your calculations
FROM your_tables;
```

### Extending the Dashboard

1. Add new API endpoint in `/api/admin/`
2. Create UI component in `/superadmin/`
3. Add navigation link in layout
4. Update audit logging

### Performance Optimization

For large datasets:
1. Convert views to materialized views
2. Add appropriate indexes
3. Implement pagination
4. Use background jobs for heavy calculations

## 🐛 Troubleshooting

### Common Issues

**"Unauthorized" error**
- Ensure you have superAdmin role
- Check if migration ran successfully
- Verify RLS policies are active

**Missing data**
- Run usage aggregation job
- Check if webhooks are configured
- Verify data model migrations

**Slow performance**
- Add indexes on frequently queried columns
- Convert to materialized views
- Implement caching layer

## 🤝 Contributing

When adding new features:
1. Always log admin actions to audit_events
2. Add appropriate RLS policies
3. Include in admin API tests
4. Update this documentation

## 📞 Support

For issues with the SuperAdmin dashboard:
1. Check audit logs for errors
2. Review browser console
3. Verify database migrations
4. Check server logs