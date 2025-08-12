# STRICT DEVELOPMENT RULES - DO NOT BREAK

## 🚨 ABSOLUTE PROHIBITIONS

### 1. **NO MOCK DATA FALLBACKS - EVER**
- **NEVER** create mock data systems or fallbacks
- **NEVER** suggest using mock data as a "temporary solution"
- **NEVER** implement mock responses for database failures
- **ALWAYS** fix the actual underlying issue instead
- Database problems must be resolved at the database level, not with workarounds

### 2. **FIX ROOT CAUSES, NOT SYMPTOMS**
- Database permission issues = Fix database permissions
- Schema mismatches = Fix the actual schema
- Connection problems = Fix the connection configuration
- **NO** bypassing or masking the real problems

### 3. **PRODUCTION-READY SOLUTIONS ONLY**
- Every solution must be production-ready
- No "temporary" workarounds that create technical debt
- No shortcuts that mask real infrastructure issues

## ✅ CORRECT APPROACHES

### For Database Issues:
1. **Identify the exact permission problem**
2. **Fix permissions in Supabase dashboard or via SQL**
3. **Verify tables exist and have correct schema**
4. **Test actual database connectivity**
5. **Ensure migrations are properly applied**

### For Schema Issues:
1. **Align Prisma schema with actual database schema**
2. **Run proper migrations**
3. **Verify field names match exactly**
4. **Test with real database queries**

### For Connection Issues:
1. **Verify connection strings**
2. **Check user permissions in database**
3. **Validate network connectivity**
4. **Fix authentication credentials**

## 🎯 CURRENT WEDDING PLANNER PROJECT STATUS

- **Problem**: Database user `prisma1` has no permissions to access tables
- **WRONG Approach**: Mock data fallback ❌
- **RIGHT Approach**: Grant proper permissions to `prisma1` user in Supabase ✅

## 📋 ACTION ITEMS FOR THIS PROJECT

1. Access Supabase dashboard
2. Grant SELECT, INSERT, UPDATE, DELETE permissions to `prisma1` user
3. Verify table access works with real queries
4. Test application functionality with real database

---

**Remember**: The user has specifically rejected mock data approaches multiple times. Always solve the real problem.