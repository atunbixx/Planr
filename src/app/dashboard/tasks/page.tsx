"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { TasksClient } from '@/lib/api/tasks.client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Task = {
  id: string
  title: string
  category: string | null
  priority: 'low'|'medium'|'high'|'urgent'
  status: 'pending'|'in_progress'|'completed'|'cancelled'|'on_hold'
  dueDate: string | null
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await TasksClient.list({ limit: 100, includeCompleted: true })
      setTasks(data.tasks as any)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markCompleted = async (taskId: string) => {
    try {
      setUpdating(taskId)
      await TasksClient.update(taskId, { status: 'completed' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update task')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Tasks</h1>

        {loading ? (
          <div className="text-sm text-dark-6">Loading tasks…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="capitalize">{t.category || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'primary' : 'outline'}>
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{t.status.replace('_',' ')}</TableCell>
                  <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    {t.status !== 'completed' && (
                      <Button size="sm" onClick={() => markCompleted(t.id)} isLoading={updating === t.id}>Complete</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
