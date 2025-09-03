import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { NotificationRepository } from '@/features/notifications/repo/notification.repository'

export const runtime = 'nodejs'

function verifyCronSecret(req: NextRequest) {
  const configured = process.env.CRON_SECRET || ''
  if (!configured) return false
  const header = req.headers.get('x-cron-secret') || ''
  return header && header === configured
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 })
  }

  const repo = new NotificationRepository()
  const now = new Date()

  try {
    // Sweep overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: { dueDate: { lt: now }, status: { not: 'completed' } },
      select: { id: true, userId: true, title: true }
    })

    for (const t of overdueTasks) {
      try { await repo.createOnce(t.userId, { type: 'task', title: 'Task overdue', body: t.title || 'Task', entityRef: t.id }) } catch {}
    }

    // Sweep budget thresholds
    const budgets = await prisma.budget.findMany({
      select: { id: true, userId: true, category: true, amount: true, actual: true }
    })
    for (const b of budgets) {
      const allocated = Number(b.amount || 0)
      const actual = Number(b.actual || 0)
      if (allocated > 0) {
        const ratio = actual / allocated
        if (actual > allocated) {
          try { await repo.createOnce(b.userId, { type: 'budget', title: 'Budget over allocated', body: `${b.category}: ${actual.toLocaleString()} > ${allocated.toLocaleString()}`, entityRef: b.id }) } catch {}
        } else if (ratio >= 0.9) {
          try { await repo.createOnce(b.userId, { type: 'budget', title: 'Budget nearing limit', body: `${b.category}: ${Math.round(ratio*100)}% used`, entityRef: b.id }) } catch {}
        }
      }
    }

    return NextResponse.json({ success: true, data: { tasksProcessed: overdueTasks.length, budgetsProcessed: budgets.length } })
  } catch (e) {
    console.error('CRON daily-sweep error:', e)
    return NextResponse.json({ success: false, error: { message: 'Internal error' } }, { status: 500 })
  }
}

