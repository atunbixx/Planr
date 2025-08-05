import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic database connection
    await prisma.$connect()
    
    // Check if users table exists and has preferences column
    const usersTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name;
    ` as any[]

    // Check if guests table exists and has new columns
    const guestsTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'guests'
      ORDER BY column_name;
    ` as any[]

    // Count existing records
    const userCount = await prisma.user.count()
    const guestCount = await prisma.guest.count()

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        guestCount
      },
      tables: {
        users: {
          columnCount: usersTableInfo.length,
          columns: usersTableInfo.map(col => ({ name: col.column_name, type: col.data_type })),
          hasPreferences: usersTableInfo.some(col => col.column_name === 'preferences')
        },
        guests: {
          columnCount: guestsTableInfo.length,
          columns: guestsTableInfo.map(col => ({ name: col.column_name, type: col.data_type })),
          hasNewFields: {
            address: guestsTableInfo.some(col => col.column_name === 'address'),
            plusOneAllowed: guestsTableInfo.some(col => col.column_name === 'plusOneAllowed'),
            attendingCount: guestsTableInfo.some(col => col.column_name === 'attendingCount'),
            dietaryRestrictions: guestsTableInfo.some(col => col.column_name === 'dietaryRestrictions')
          }
        }
      }
    })

  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}