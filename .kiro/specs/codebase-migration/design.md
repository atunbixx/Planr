# Codebase Migration Design Document

## Overview

This design document outlines the systematic approach for migrating all authentication fixes, database improvements, and New York Magazine theme changes from the current working codebase to a fresh copy in a different directory. The migration will be performed using file operations to ensure complete preservation of functionality while maintaining clean organization.

## Architecture

### Migration Strategy

The migration follows a **layered approach** where we copy files in dependency order:

1. **Foundation Layer**: Core theme system and utilities
2. **Infrastructure Layer**: Database migrations and configuration
3. **Component Layer**: Updated React components and pages  
4. **Integration Layer**: Authentication and routing logic
5. **Verification Layer**: Debug tools and testing utilities

### Directory Structure Mapping

```
Source Directory (Current)          →    Target Directory (New)
├── src/styles/theme/              →    ├── src/styles/theme/
├── supabase/migrations/           →    ├── supabase/migrations/
├── src/app/auth/signin/           →    ├── src/app/auth/signin/
├── src/app/dashboard/             →    ├── src/app/dashboard/
├── debug scripts (root)           →    ├── debug scripts (root)
└── .kiro/specs/ny-magazine-theme/ →    └── .kiro/specs/ny-magazine-theme/
```

## Components and Interfaces

### 1. Theme System Migration Component

**Purpose**: Migrate the complete New York Magazine theme system

**Files to Copy**:
- `src/styles/theme/colors.ts` - Color palette and semantic color tokens
- `src/styles/theme/typography.ts` - Font families, sizes, and text styles
- `src/styles/theme/components.ts` - Component-specific styling utilities
- `src/styles/theme/spacing.ts` - Spacing scale and layout utilities
- `src/styles/theme/animations.ts` - Animation and transition definitions
- `src/styles/theme/index.ts` - Main theme export and utility functions

**Interface**:
```typescript
interface ThemeMigration {
  sourceThemePath: string
  targetThemePath: string
  verifyThemeIntegrity(): boolean
  copyThemeFiles(): Promise<void>
}
```

### 2. Database Migration Component

**Purpose**: Transfer all database schema fixes and migrations

**Files to Copy**:
- `supabase/migrations/20250108120000_create_missing_tables.sql`
- `supabase/migrations/20250108121000_fix_table_references.sql`
- `supabase/config.toml` (if modified)
- `supabase/seed.sql` (if exists)

**Interface**:
```typescript
interface DatabaseMigration {
  sourceMigrationsPath: string
  targetMigrationsPath: string
  copyMigrationFiles(): Promise<void>
  validateMigrationIntegrity(): boolean
}
```

### 3. Authentication System Migration Component

**Purpose**: Migrate all authentication fixes and improvements

**Files to Copy**:
- `src/app/auth/signin/page.tsx` - Fixed signin page with proper form handling
- `src/app/auth/signin/page-new.tsx` - Alternative themed signin page
- `src/app/dashboard/layout.tsx` - Updated dashboard layout with auth checks
- Authentication-related hooks and utilities

**Interface**:
```typescript
interface AuthMigration {
  sourceAuthPath: string
  targetAuthPath: string
  copyAuthComponents(): Promise<void>
  verifyAuthIntegration(): boolean
}
```

### 4. Themed Pages Migration Component

**Purpose**: Migrate all pages updated with NY Magazine theme

**Files to Copy**:
- `src/app/dashboard/page.tsx` - Themed dashboard home
- `src/app/dashboard/page-light.tsx` - Alternative dashboard version
- Any other themed page components
- Updated component files with theme integration

**Interface**:
```typescript
interface ThemedPagesMigration {
  sourcePagesPath: string
  targetPagesPath: string
  copyThemedPages(): Promise<void>
  validateThemeApplication(): boolean
}
```

### 5. Debug Tools Migration Component

**Purpose**: Transfer all debugging and utility scripts

**Files to Copy**:
- `test-auth.js` - Authentication testing script
- `debug-login-flow.js` - Login flow debugging
- `debug-dashboard-auth.js` - Dashboard authentication testing
- `setup-database.js` - Database setup utilities
- Other diagnostic scripts

**Interface**:
```typescript
interface DebugToolsMigration {
  sourceDebugPath: string
  targetDebugPath: string
  copyDebugScripts(): Promise<void>
  updateScriptPaths(): Promise<void>
}
```

## Data Models

### Migration Configuration Model

```typescript
interface MigrationConfig {
  sourceDirectory: string
  targetDirectory: string
  preserveGitHistory: boolean
  backupOriginal: boolean
  verificationEnabled: boolean
  migrationSteps: MigrationStep[]
}

interface MigrationStep {
  name: string
  description: string
  sourceFiles: string[]
  targetPath: string
  dependencies: string[]
  verificationScript?: string
}
```

### File Operation Model

```typescript
interface FileOperation {
  operation: 'copy' | 'create' | 'update'
  sourcePath: string
  targetPath: string
  preserveTimestamps: boolean
  overwriteExisting: boolean
}
```

## Error Handling

### Migration Error Types

1. **File System Errors**
   - Source file not found
   - Target directory not writable
   - Insufficient disk space
   - Permission denied

2. **Dependency Errors**
   - Missing required files
   - Broken import paths
   - Version mismatches

3. **Verification Errors**
   - Theme integration failures
   - Authentication test failures
   - Database migration errors

### Error Recovery Strategy

```typescript
interface ErrorRecovery {
  rollbackOnFailure: boolean
  createBackups: boolean
  continueOnNonCriticalErrors: boolean
  logAllOperations: boolean
}
```

## Testing Strategy

### Pre-Migration Verification

1. **Source Code Validation**
   - Verify all source files exist and are readable
   - Check for any uncommitted changes
   - Validate theme system integrity
   - Test authentication functionality

2. **Target Environment Preparation**
   - Ensure target directory exists and is writable
   - Verify sufficient disk space
   - Check for conflicting files

### Post-Migration Verification

1. **File Integrity Checks**
   - Verify all files copied successfully
   - Check file sizes and checksums
   - Validate directory structure

2. **Functional Testing**
   - Test theme system loading
   - Verify authentication flow
   - Check database migration compatibility
   - Test debug scripts functionality

3. **Integration Testing**
   - Verify all imports resolve correctly
   - Test component rendering with theme
   - Validate authentication state management
   - Check database connectivity

### Automated Verification Script

```typescript
interface VerificationSuite {
  themeSystemTest(): Promise<boolean>
  authenticationTest(): Promise<boolean>
  databaseConnectionTest(): Promise<boolean>
  componentRenderingTest(): Promise<boolean>
  importResolutionTest(): Promise<boolean>
}
```

## Implementation Phases

### Phase 1: Foundation Setup
- Create target directory structure
- Copy theme system files
- Verify theme system integrity

### Phase 2: Database Migration
- Copy migration files
- Transfer configuration files
- Validate migration scripts

### Phase 3: Authentication System
- Copy authentication components
- Update import paths if necessary
- Test authentication flow

### Phase 4: Themed Components
- Copy all themed page components
- Verify theme integration
- Test component rendering

### Phase 5: Debug Tools
- Copy all debug scripts
- Update script configurations
- Test script functionality

### Phase 6: Final Verification
- Run comprehensive test suite
- Verify all functionality
- Generate migration report

## Configuration Management

### Environment Variables
- Supabase URL and keys
- Database connection strings
- Authentication settings
- Theme configuration options

### Package Dependencies
- Ensure all required packages are installed
- Verify version compatibility
- Update package.json if necessary

## Security Considerations

### Sensitive Data Handling
- Exclude environment files from migration
- Sanitize debug scripts of sensitive information
- Ensure proper file permissions

### Access Control
- Verify target directory permissions
- Ensure secure file operations
- Validate user access rights

## Performance Optimization

### Efficient File Operations
- Use streaming for large files
- Implement parallel copying where safe
- Minimize disk I/O operations

### Progress Tracking
- Provide real-time migration progress
- Log all operations for audit trail
- Enable cancellation if needed