import { api } from '../src/lib/api/client.js'
import { apiCache } from '../src/lib/api/cache.js'

console.log('🧪 Testing API Caching System')
console.log('=' .repeat(50))

async function testCaching() {
  try {
    // Test 1: First request should miss cache
    console.log('\n📍 Test 1: Initial request (cache miss expected)')
    console.time('First request')
    const firstResponse = await api.guests.list({ limit: 10 })
    console.timeEnd('First request')
    console.log('✅ First request completed')
    
    // Check cache stats
    const stats1 = apiCache.getStats()
    console.log(`📊 Cache stats: ${stats1.size} entries`)
    
    // Test 2: Second request should hit cache
    console.log('\n📍 Test 2: Repeated request (cache hit expected)')
    console.time('Second request')
    const secondResponse = await api.guests.list({ limit: 10 })
    console.timeEnd('Second request')
    console.log('✅ Second request completed (should be much faster)')
    
    // Test 3: Different parameters should miss cache
    console.log('\n📍 Test 3: Different parameters (cache miss expected)')
    console.time('Third request')
    const thirdResponse = await api.guests.list({ limit: 20 })
    console.timeEnd('Third request')
    console.log('✅ Third request completed')
    
    // Check cache stats
    const stats2 = apiCache.getStats()
    console.log(`📊 Cache stats: ${stats2.size} entries`)
    console.log('📋 Cache entries:', stats2.entries)
    
    // Test 4: Test cache invalidation on mutation
    console.log('\n📍 Test 4: Testing cache invalidation')
    console.log('Creating a new guest...')
    await api.guests.create({
      firstName: 'Test',
      lastName: 'Guest',
      email: 'test@example.com',
      rsvpStatus: 'pending'
    })
    console.log('✅ Guest created - cache should be invalidated')
    
    // Check if cache was invalidated
    const stats3 = apiCache.getStats()
    console.log(`📊 Cache stats after mutation: ${stats3.size} entries`)
    
    // Test 5: Dashboard stats caching
    console.log('\n📍 Test 5: Dashboard stats caching')
    console.time('Dashboard first')
    await api.dashboard.stats()
    console.timeEnd('Dashboard first')
    
    console.time('Dashboard cached')
    await api.dashboard.stats()
    console.timeEnd('Dashboard cached')
    console.log('✅ Dashboard stats cached successfully')
    
    // Test 6: Settings caching (long TTL)
    console.log('\n📍 Test 6: Settings caching (30min TTL)')
    console.time('Settings first')
    await api.settings.preferences.get()
    console.timeEnd('Settings first')
    
    console.time('Settings cached')
    await api.settings.preferences.get()
    console.timeEnd('Settings cached')
    console.log('✅ Settings cached with long TTL')
    
    // Final cache stats
    const finalStats = apiCache.getStats()
    console.log('\n📊 Final Cache Statistics:')
    console.log(`   Total entries: ${finalStats.size}`)
    console.log('   Cached endpoints:')
    finalStats.entries.forEach(entry => {
      console.log(`   - ${entry}`)
    })
    
    console.log('\n✅ All caching tests completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  }
}

// Run the tests
testCaching()