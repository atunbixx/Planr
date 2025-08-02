# Prisma Setup Guide for Wedding Planner V2

This guide provides complete instructions for setting up and using Prisma with your wedding planner application.

## 🚀 Quick Start

### 1. Environment Setup
The project is already configured with Prisma. The following files have been created:

- `prisma/schema.prisma` - Complete database schema
- `prisma/seed.ts` - Database seeding script
- `src/lib/prisma.ts` - Prisma client singleton
- `.env` - Environment variables for database connection

### 2. Database Connection
Your database URL is already configured in `.env`:
```bash
DATABASE_URL="postgresql://postgres.gpfxxbhowailwllpgphe:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

**⚠️ Important**: Replace `YOUR_PASSWORD` with your actual Supabase database password.

### 3. Install Dependencies
```bash
npm install
```

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

### 5. Sync Database Schema
```bash
npm run prisma:push
```

### 6. Seed Database (Optional)
```bash
npm run prisma:seed
```

## 📊 Database Schema Overview

### Core Entities
- **couples** - Main wedding couple information
- **vendors** - Vendor management and tracking
- **guests** - Guest list management
- **budget_categories** - Budget category organization
- **budget_expenses** - Individual expense tracking
- **tasks** - Task management system
- **timeline_items** - Wedding day timeline
- **messages** - Communication system
- **activity_feed** - Activity logging

### Key Relationships
- Couples have many vendors, guests, tasks, etc.
- Vendors belong to couples and can have expenses, tasks
- Budget expenses belong to categories and can link to vendors
- Tasks can be assigned to vendors
- Timeline items can involve vendors

## 🛠️ Available Commands

### Prisma Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Reset database and re-apply migrations
npm run prisma:reset

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database with sample data
npm run prisma:seed

# Pull schema from existing database
npm run prisma:pull

# Push schema changes to database
npm run prisma:push
```

## 🔧 Usage Examples

### Basic CRUD Operations

#### Creating a Couple
```typescript
import { prisma } from '@/lib/prisma'

const couple = await prisma.couples.create({
  data: {
    partner1_name: 'Alice Johnson',
    partner2_name: 'Bob Smith',
    wedding_date: new Date('2025-12-15'),
    estimated_guests: 150,
    total_budget: 50000,
  }
})
```

#### Adding a Vendor
```typescript
const vendor = await prisma.vendors.create({
  data: {
    couple_id: couple.id,
    name: 'Elegant Photography',
    category: 'photography',
    status: 'booked',
    estimated_cost: 3500,
  }
})
```

#### Querying with Relations
```typescript
// Get couple with all related data
const coupleWithData = await prisma.couples.findUnique({
  where: { id: coupleId },
  include: {
    vendors: true,
    guests: true,
    budget_categories: true,
    tasks: true,
  }
})
```

### Advanced Queries

#### Budget Tracking
```typescript
// Get budget summary
const budgetSummary = await prisma.budget_categories.findMany({
  where: { couple_id: coupleId },
  include: {
    budget_expenses: true,
  }
})

// Calculate total spent
const totalSpent = await prisma.budget_expenses.aggregate({
  where: { couple_id: coupleId },
  _sum: { amount: true }
})
```

#### Task Management
```typescript
// Get overdue tasks
const overdueTasks = await prisma.tasks.findMany({
  where: {
    couple_id: coupleId,
    completed: false,
    due_date: { lt: new Date() }
  }
})
```

## 🎯 Integration with Next.js

### Server Components
```typescript
// app/api/couples/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const couples = await prisma.couples.findMany()
  return NextResponse.json(couples)
}
```

### Client Components
```typescript
// components/BudgetOverview.tsx
'use client'
import { useEffect, useState } from 'react'
import { Prisma } from '@prisma/client'

type BudgetWithExpenses = Prisma.budget_categoriesGetPayload<{
  include: { budget_expenses: true }
}>

export function BudgetOverview({ coupleId }: { coupleId: string }) {
  const [budget, setBudget] = useState<BudgetWithExpenses[]>([])
  
  useEffect(() => {
    fetch(`/api/couples/${coupleId}/budget`)
      .then(res => res.json())
      .then(setBudget)
  }, [coupleId])
  
  return <div>{/* Render budget data */}</div>
}
```

## 📱 iOS App Integration

Prisma will be extremely beneficial for your iOS app development:

### 1. **Type Safety**
- Full TypeScript support ensures type-safe API calls
- Auto-generated types for all database models
- Compile-time error checking

### 2. **API Development**
- RESTful API endpoints using Next.js API routes
- GraphQL support with Prisma + Apollo
- Real-time subscriptions with Prisma + WebSockets

### 3. **Data Synchronization**
- Consistent data models across web and mobile
- Easy data migration between platforms
- Offline-first capabilities with Prisma + SQLite

### 4. **Performance**
- Efficient database queries with Prisma's query optimization
- Connection pooling with Supabase
- Caching strategies with Prisma Accelerate

## 🔐 Security Best Practices

### Row Level Security (RLS)
Prisma works seamlessly with Supabase's RLS policies. Ensure your policies are set up correctly:

```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own couple data" ON couples
  FOR ALL USING (
    partner1_user_id = auth.uid() OR partner2_user_id = auth.uid()
  )
```

### Environment Variables
- Never commit `.env` files to version control
- Use different database URLs for development/staging/production
- Rotate database passwords regularly

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL in .env
   - Ensure Supabase project is running
   - Verify network connectivity

2. **Type Generation Issues**
   - Run `npm run prisma:generate`
   - Check schema.prisma syntax
   - Ensure all relations are properly defined

3. **Migration Conflicts**
   - Use `npm run prisma:reset` for development
   - Create proper migrations for production
   - Backup data before major changes

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Supabase + Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Next.js + Prisma Examples](https://github.com/prisma/prisma-examples/tree/latest/typescript/rest-nextjs-api-routes)
- [Prisma Studio](https://www.prisma.io/studio)

## 🔄 Migration from Supabase

If you want to gradually migrate from Supabase client to Prisma:

1. **Phase 1**: Use Prisma for complex queries while keeping Supabase for auth
2. **Phase 2**: Replace Supabase client calls with Prisma in new features
3. **Phase 3**: Full migration with Prisma as primary data access layer

The current setup allows you to use both Supabase and Prisma simultaneously, giving you flexibility during the transition period.
