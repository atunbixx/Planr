# Contributing to Wedding Planner

## 🔒 CRITICAL: Schema Protection Rules

### 🚨 NEVER RUN `prisma db pull`

**This command will destroy our schema mappings and must NEVER be used!**

```bash
# ❌ FORBIDDEN COMMANDS
prisma db pull      # Destroys @map directives  
prisma introspect   # Same as db pull

# ✅ SAFE COMMANDS ONLY
prisma migrate dev  # Creates migrations safely
prisma generate     # Updates client only
```

### 📐 Naming Conventions

**Prisma Models**: Use `camelCase` with `@map` directives
```prisma
model User {
  clerkUserId String @map("clerk_user_id")
  firstName   String @map("first_name")
  createdAt   DateTime @map("created_at")
}
```

**Database Columns**: Always `snake_case` (PostgreSQL standard)
```sql
-- Actual columns in database
clerk_user_id, first_name, created_at
```

## 🛠️ Development Workflow

### Making Schema Changes

1. **Always backup first**:
   ```bash
   npm run schema:backup
   ```

2. **Edit `prisma/schema.prisma` directly** (never pull from DB)

3. **Create migration**:
   ```bash
   prisma migrate dev --name "your-change-description"
   ```

4. **Validate schema**:
   ```bash
   npm run schema:validate
   ```

5. **Generate client**:
   ```bash
   prisma generate
   ```

### Emergency Recovery

If someone accidentally runs `prisma db pull`:

1. **DON'T PANIC** - Don't commit the changes
2. **Restore from backup**:
   ```bash
   npm run schema:list-backups
   npm run schema:restore schema-[timestamp].prisma
   ```
3. **Or restore from Git**:
   ```bash
   git checkout -- prisma/schema.prisma
   ```
4. **Regenerate client**:
   ```bash
   prisma generate
   ```

## 🧪 Testing Schema Changes

Always test your schema changes:

```bash
# Validate naming conventions
npm run schema:check

# Run type checking
npm run typecheck

# Run tests
npm test
```

## 🔍 Available Schema Commands

```bash
npm run schema:validate      # Check for naming issues
npm run schema:backup        # Create timestamped backup  
npm run schema:restore       # Restore from backup
npm run schema:list-backups  # Show available backups
npm run schema:check         # Full validation check
```

## 🚫 Code Review Checklist

Before merging any PR that touches `prisma/schema.prisma`:

- [ ] Schema validation passes (`npm run schema:check`)
- [ ] All fields use `camelCase` in Prisma models
- [ ] All database mappings use `@map("snake_case")`
- [ ] No `prisma db pull` commands in scripts or docs
- [ ] Migration files are included if schema changed
- [ ] Tests pass with new schema

## 📚 Why These Rules Matter

1. **Consistency**: Prevents field name mismatches between code and database
2. **Maintainability**: Clear mapping between camelCase (code) and snake_case (DB)
3. **Safety**: Protects against accidental schema corruption
4. **Performance**: Reduces debugging time from naming conflicts

---

**Remember: Our schema is our source of truth. Protect it at all costs! 🛡️**