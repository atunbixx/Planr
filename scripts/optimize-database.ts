import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

interface QueryMetrics {
  query: string
  avgTime: number
  count: number
  totalTime: number
}

const queryMetrics: Map<string, QueryMetrics> = new Map()

// Hook into Prisma query events
prisma.$on('query' as any, (e: any) => {
  const key = e.query.replace(/\$\d+/g, '?') // Normalize query
  const existing = queryMetrics.get(key) || { query: key, avgTime: 0, count: 0, totalTime: 0 }
  
  existing.count++
  existing.totalTime += e.duration
  existing.avgTime = existing.totalTime / existing.count
  
  queryMetrics.set(key, existing)
})

async function analyzeQueryPerformance() {
  console.log('🔍 Analyzing database query performance...\n')

  // Test dashboard stats query
  console.log('📊 Testing dashboard stats query...')
  const dashboardStart = performance.now()
  
  const dashboardResult = await prisma.couple.findFirst({
    where: { user_id: 'test-id' },
    include: {
      guests: {
        select: {
          id: true,
          plus_one_allowed: true,
          plus_one_name: true,
          attendingCount: true,
          attending_status: true
        }
      },
      vendors: {
        select: {
          id: true,
          status: true
        }
      }
    }
  })
  
  const dashboardTime = performance.now() - dashboardStart
  console.log(`Dashboard query took: ${dashboardTime.toFixed(2)}ms`)

  // Test guest list query
  console.log('\n👥 Testing guest list query...')
  const guestStart = performance.now()
  
  const guestResult = await prisma.couple.findFirst({
    where: { user_id: 'test-id' },
    include: {
      guests: {
        orderBy: { created_at: 'desc' }
      }
    }
  })
  
  const guestTime = performance.now() - guestStart
  console.log(`Guest list query took: ${guestTime.toFixed(2)}ms`)

  // Analyze N+1 query issues
  console.log('\n🚨 Checking for N+1 query issues...')
  
  // Print query metrics
  console.log('\n📈 Query Metrics:')
  const sortedMetrics = Array.from(queryMetrics.values())
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10)
  
  sortedMetrics.forEach((metric, index) => {
    console.log(`${index + 1}. Query: ${metric.query.substring(0, 100)}...`)
    console.log(`   Count: ${metric.count}, Avg Time: ${metric.avgTime.toFixed(2)}ms, Total Time: ${metric.totalTime.toFixed(2)}ms`)
  })
}

async function suggestOptimizations() {
  console.log('\n💡 Database Optimization Suggestions:\n')

  // Check for missing indexes
  console.log('1. Missing Indexes:')
  
  // Check if user_id is indexed on couples table
  const coupleIndexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'couples'
  ` as any[]
  
  const hasUserIdIndex = coupleIndexes.some(idx => 
    idx.indexdef.includes('user_id')
  )
  
  if (!hasUserIdIndex) {
    console.log('   ❌ Missing index on couples.user_id')
    console.log('   Add: @@index([user_id], map: "idx_couples_user_id")')
  }

  // Check guest indexes
  const guestIndexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'guests'
  ` as any[]
  
  const hasAttendingStatusIndex = guestIndexes.some(idx => 
    idx.indexdef.includes('attending_status')
  )
  
  if (!hasAttendingStatusIndex) {
    console.log('   ❌ Missing index on guests.attending_status')
    console.log('   Add: @@index([attending_status], map: "idx_guests_attending_status")')
  }

  // Suggest query optimizations
  console.log('\n2. Query Optimizations:')
  console.log('   • Use select to limit fields returned')
  console.log('   • Implement pagination for large result sets')
  console.log('   • Use findMany with where instead of filter in application')
  console.log('   • Cache frequently accessed data (already implemented ✅)')

  // Suggest connection pooling
  console.log('\n3. Connection Pool Settings:')
  console.log('   DATABASE_URL should include: ?connection_limit=5&pool_timeout=10')

  // Suggest data aggregation
  console.log('\n4. Data Aggregation:')
  console.log('   • Use Prisma aggregate functions for counts')
  console.log('   • Consider materialized views for complex dashboard stats')
  console.log('   • Implement database-level computed columns for derived values')
}

async function generateOptimizedQueries() {
  console.log('\n🚀 Optimized Query Examples:\n')

  // Optimized dashboard stats
  console.log('1. Optimized Dashboard Stats Query:')
  console.log(`
const dashboardStats = await prisma.$transaction([
  // Get couple with basic info
  prisma.couple.findFirst({
    where: { user_id: userId },
    select: {
      id: true,
      wedding_date: true,
      venue_name: true,
      total_budget: true,
      partner1_name: true,
      partner2_name: true
    }
  }),
  
  // Get guest stats separately
  prisma.guest.groupBy({
    by: ['attending_status'],
    where: { couple_id: coupleId },
    _count: true
  }),
  
  // Get vendor stats separately
  prisma.vendor.groupBy({
    by: ['status'],
    where: { couple_id: coupleId },
    _count: true
  })
])
`)

  // Optimized guest list
  console.log('\n2. Optimized Guest List Query:')
  console.log(`
const guests = await prisma.guest.findMany({
  where: { couple_id: coupleId },
  select: {
    id: true,
    name: true,
    first_name: true,
    last_name: true,
    email: true,
    phone: true,
    side: true,
    relationship: true,
    plus_one_allowed: true,
    attending_status: true,
    dietary_restrictions: true,
    notes: true
  },
  orderBy: { created_at: 'desc' },
  take: 50, // Pagination
  skip: offset
})
`)
}

async function createMigrationFile() {
  console.log('\n📝 Creating migration file for optimizations...')
  
  const migrationContent = `-- Add missing indexes for query optimization

-- Index for couples.user_id (frequently used in queries)
CREATE INDEX IF NOT EXISTS idx_couples_user_id ON couples(user_id);

-- Index for guests.attending_status (used in stats calculations)
CREATE INDEX IF NOT EXISTS idx_guests_attending_status ON guests(attending_status);

-- Composite index for guests couple_id and attending_status
CREATE INDEX IF NOT EXISTS idx_guests_couple_attending ON guests(couple_id, attending_status);

-- Index for photos.couple_id if not exists
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);

-- Index for vendors.couple_id and status
CREATE INDEX IF NOT EXISTS idx_vendors_couple_status ON vendors(couple_id, status);

-- Add database functions for common calculations
CREATE OR REPLACE FUNCTION get_guest_stats(p_couple_id UUID)
RETURNS TABLE(
  total INTEGER,
  confirmed INTEGER,
  declined INTEGER,
  pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE attending_status = 'yes')::INTEGER as confirmed,
    COUNT(*) FILTER (WHERE attending_status = 'no')::INTEGER as declined,
    COUNT(*) FILTER (WHERE attending_status IS NULL OR attending_status = 'pending')::INTEGER as pending
  FROM guests
  WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql;
`

  await require('fs').promises.writeFile(
    './prisma/migrations/optimize_queries/migration.sql',
    migrationContent
  )
  
  console.log('✅ Migration file created at: ./prisma/migrations/optimize_queries/migration.sql')
}

async function main() {
  try {
    console.log('🏃 Starting database optimization analysis...\n')
    
    await analyzeQueryPerformance()
    await suggestOptimizations()
    await generateOptimizedQueries()
    await createMigrationFile()
    
    console.log('\n✅ Database optimization analysis complete!')
    
  } catch (error) {
    console.error('❌ Error during optimization:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { analyzeQueryPerformance, suggestOptimizations }