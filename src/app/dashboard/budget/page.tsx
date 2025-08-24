"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { BudgetClient, type RawBudgetItem, type BudgetSummary } from '@/lib/api/budget.client'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function BudgetPage() {
  const [items, setItems] = useState<RawBudgetItem[]>([])
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { items, summary } = await BudgetClient.list()
        setItems(items)
        setSummary(summary)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load budget')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white">Budget</h1>

        {summary && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Total Budget</div>
                <div className="text-2xl font-bold mt-2">${summary.totalAmount.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Allocated</div>
                <div className="text-2xl font-bold mt-2">${summary.totalAllocated.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Actual</div>
                <div className="text-2xl font-bold mt-2">${summary.totalActual.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-[#475569]">Remaining</div>
                <div className="text-2xl font-bold mt-2">${summary.remainingBudget.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-dark-6">Loading budget…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium capitalize">{i.category}</TableCell>
                  <TableCell className="text-right">${Number(i.allocated).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${Number(i.actual).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{i.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PremiumDashboardLayout>
  )
}
