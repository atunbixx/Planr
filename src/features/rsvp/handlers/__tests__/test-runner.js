#!/usr/bin/env node

/**
 * Test runner for RSVP handler tests
 * Runs all RSVP handler tests and provides detailed output
 */

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🧪 Running RSVP Handler Tests...\n')

const testFiles = [
  'rsvp.handler.test.ts'
]

let totalTests = 0
let passedTests = 0
let failedTests = 0

for (const testFile of testFiles) {
  console.log(`\n📋 Running ${testFile}...`)
  console.log('='.repeat(50))
  
  try {
    const testPath = join(__dirname, testFile)
    const output = execSync(`npx vitest run ${testPath} --reporter=verbose`, {
      encoding: 'utf8',
      cwd: process.cwd()
    })
    
    console.log(output)
    
    // Parse test results (basic parsing)
    const lines = output.split('\n')
    for (const line of lines) {
      if (line.includes('✓') || line.includes('passed')) {
        passedTests++
        totalTests++
      } else if (line.includes('✗') || line.includes('failed')) {
        failedTests++
        totalTests++
      }
    }
    
    console.log(`✅ ${testFile} completed successfully`)
    
  } catch (error) {
    console.error(`❌ ${testFile} failed:`)
    console.error(error.stdout || error.message)
    failedTests++
  }
}

console.log('\n' + '='.repeat(60))
console.log('📊 RSVP HANDLER TEST SUMMARY')
console.log('='.repeat(60))
console.log(`Total Tests: ${totalTests}`)
console.log(`Passed: ${passedTests}`)
console.log(`Failed: ${failedTests}`)
console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`)

if (failedTests === 0) {
  console.log('\n🎉 All RSVP handler tests passed!')
  process.exit(0)
} else {
  console.log(`\n❌ ${failedTests} test(s) failed`)
  process.exit(1)
}