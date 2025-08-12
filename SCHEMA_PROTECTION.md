# 🔒 SCHEMA PROTECTION RULES

## 🚨 CRITICAL: DO NOT RUN `prisma db pull`

**`prisma db pull` DESTROYS our schema mappings and should NEVER be used!**

### ❌ What NOT to do:
```bash
prisma db pull        # ❌ NEVER - Destroys @map directives
prisma introspect     # ❌ NEVER - Same as db pull
```

### ✅ What TO do instead:
```bash
prisma migrate dev    # ✅ ALWAYS - Preserves mappings
prisma generate       # ✅ SAFE - Updates client only
```

---

## 🧩 NAMING CONVENTION RULES

### Prisma Schema Fields: `camelCase`
```prisma
model User {
  clerkUserId  String   @map("clerk_user_id")
  firstName    String   @map("first_name") 
  totalBudget  Decimal? @map("total_budget")
}
```

### Database Columns: `snake_case`  
```sql
-- Actual PostgreSQL columns
clerk_user_id, first_name, total_budget
```

### Table Names: Use `@@map` if snake_case
```prisma
model UserSettings {
  id String @id
  
  @@map("user_settings")  // Maps to snake_case table
}
```

---

## 🛡️ PROTECTION MECHANISMS

### 1. Schema Backup Script
```bash
# Always backup before any risky operation
cp prisma/schema.prisma prisma/schema.backup.prisma
```

### 2. Validation Script
```bash
# Check schema for missing @map directives
npm run validate-schema
```

### 3. Git Pre-commit Hook
```bash
# Prevents commits with broken schema
npm run schema-check
```

---

## ⚠️ IF SOMEONE ACCIDENTALLY RUNS `prisma db pull`

1. **STOP immediately** - Don't commit the changes
2. **Restore from backup**: `cp prisma/schema.backup.prisma prisma/schema.prisma`
3. **Or restore from Git**: `git checkout -- prisma/schema.prisma`
4. **Regenerate client**: `prisma generate`

---

## 🚀 SAFE MIGRATION WORKFLOW

```bash
# 1. Make schema changes in prisma/schema.prisma
# 2. Create and apply migration
prisma migrate dev --name "your-change-description"

# 3. Generate updated client
prisma generate

# 4. Test your changes
npm test
```

**Never skip the migration step - it's what protects your mappings!**