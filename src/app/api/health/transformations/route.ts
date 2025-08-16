import { NextResponse } from 'next/server'
import { transformToCamelCase, transformToSnakeCase } from '@/lib/db/field-mappings'
import { getAdminClient } from '@/lib/supabase-admin-transformed'

/**
 * Health check endpoint to verify field transformations are working correctly
 */
export async function GET() {
  try {
    // Test data for transformation
    const testSnakeCase = {
      partner1_user_id: 'test-123',
      wedding_date: '2024-06-15',
      total_budget: 50000,
      created_at: new Date().toISOString()
    }

    const testCamelCase = {
      partner1UserId: 'test-123',
      weddingDate: '2024-06-15',
      totalBudget: 50000,
      createdAt: new Date().toISOString()
    }

    // Test transformations
    const snakeToCamel = transformToCamelCase(testSnakeCase)
    const camelToSnake = transformToSnakeCase(testCamelCase)

    // Test client availability
    const supabase = getAdminClient()
    const clientAvailable = !!supabase

    // Validation checks
    const checks = {
      snakeToCamelTransform: {
        passed: (snakeToCamel as any).partner1UserId === 'test-123' && 
                (snakeToCamel as any).weddingDate === '2024-06-15',
        result: snakeToCamel
      },
      camelToSnakeTransform: {
        passed: (camelToSnake as any).partner1_user_id === 'test-123' && 
                (camelToSnake as any).wedding_date === '2024-06-15',
        result: camelToSnake
      },
      transformedClientAvailable: {
        passed: clientAvailable,
        result: { available: clientAvailable }
      },
      roundtripConsistency: {
        passed: JSON.stringify(Object.keys(testSnakeCase).sort()) === 
                JSON.stringify(Object.keys(transformToSnakeCase(transformToCamelCase(testSnakeCase))).sort()),
        result: { consistent: true }
      }
    }

    const allPassed = Object.values(checks).every(check => check.passed)

    return NextResponse.json({
      success: true,
      status: allPassed ? 'healthy' : 'issues_detected',
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: Object.keys(checks).length,
        passed: Object.values(checks).filter(c => c.passed).length,
        failed: Object.values(checks).filter(c => !c.passed).length
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}