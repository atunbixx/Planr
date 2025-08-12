# Wedding Planner V2 - Migration Quick Start

## 🚀 Quick Setup (5 Minutes)

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# Minimum required: DATABASE_URL
```

### 2. Database Migration
```bash
# Apply all migrations in correct order
npm run migrate:full

# Check migration status
npm run migrate:status

# Validate schema
npm run migrate:validate
```

### 3. Seed Development Data
```bash
# Seed with sample data
npm run db:seed

# OR: Complete setup (migrate + seed)
npm run dev:setup
```

### 4. Start Development
```bash
# Start the application
npm run dev

# Application will be available at http://localhost:4010
```

## 🛠️ Available Migration Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `migrate:status` | Show applied migrations | `npm run migrate:status` |
| `migrate:validate` | Validate schema consistency | `npm run migrate:validate` |
| `migrate:full` | Apply all migrations in order | `npm run migrate:full` |
| `migrate:apply` | Apply specific migration | `npm run migrate:apply -- path/to/migration.sql` |
| `migrate:reset` | Reset DB and apply all migrations | `npm run migrate:reset` |
| `migrate:prod` | Production-safe migration | `npm run migrate:prod` |

## 📋 Migration Order (Critical)

Migrations **must** be applied in this exact order:

1. **Base Schema** (Prisma schema.prisma)
2. **Query Optimization** (20240807_optimize_queries)
3. **RSVP Security** (20240807_rsvp_security_tables)
4. **Seating Planner** (20240108_seating_planner)
5. **Day-of Dashboard** (20240108_day_of_dashboard)
6. **Communications** (20240109_communication_documents)

## ⚡ Common Issues & Solutions

### Issue: Connection Failed
```bash
# Check your DATABASE_URL in .env file
echo $DATABASE_URL

# Test connection manually
npm run migrate:status
```

### Issue: Migration Already Applied
```bash
# Check migration status
npm run migrate:status

# Force re-run if needed
npm run migrate:full -- --force
```

### Issue: Schema Validation Failed
```bash
# Reset and re-apply migrations
npm run migrate:reset

# Check for missing tables
npm run migrate:validate
```

## 📁 Project Structure

```
├── MIGRATIONS.md          # Complete migration guide
├── .env.example          # Environment template
├── scripts/
│   └── migrate-runner.js # Migration runner script
└── prisma/
    ├── schema.prisma     # Base schema
    └── migrations/       # SQL migration files
        ├── 20240807_optimize_queries/
        ├── 20240807_rsvp_security_tables/
        ├── 20240108_seating_planner/
        ├── 20240108_day_of_dashboard/
        └── 20240109_communication_documents/
```

## 🔗 Need Help?

- **Full Documentation**: See `MIGRATIONS.md`
- **Environment Setup**: See `.env.example`
- **Development Guide**: See main `README.md`

---

✅ **Ready to go!** Run `npm run dev:setup` to get started quickly.