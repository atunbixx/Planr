'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useBudget } from '@/hooks/useBudget'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Download,
  FileText,
  FileSpreadsheet,
  FilePdf
} from 'lucide-react'

export function BudgetExport() {
  const { categories, expenses } = useBudget()
  const { couple } = useAuth()
  const { addToast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const generateCSV = () => {
    // Generate CSV content
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Status', 'Payment Method', 'Notes']
    const rows = expenses.map(expense => {
      const category = categories.find(c => c.id === expense.category_id)
      return [
        expense.date_incurred,
        expense.description,
        category?.name || 'Uncategorized',
        expense.amount,
        expense.payment_status || 'pending',
        expense.payment_method || '',
        expense.notes || ''
      ]
    })

    // Add summary rows
    rows.push([])
    rows.push(['SUMMARY'])
    rows.push(['Category', 'Allocated', 'Spent', 'Remaining', 'Percentage'])
    categories.forEach(cat => {
      rows.push([
        cat.name,
        cat.allocated_amount,
        cat.spent_amount,
        cat.allocated_amount - cat.spent_amount,
        cat.allocated_amount > 0 ? Math.round((cat.spent_amount / cat.allocated_amount) * 100) + '%' : '0%'
      ])
    })

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  }

  const generatePDFContent = () => {
    // Generate HTML content for PDF
    const totalBudget = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0)
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent_amount, 0)
    const totalRemaining = totalBudget - totalSpent

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Wedding Budget Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { margin: 20px 0; }
          .summary-item { margin: 10px 0; }
          .over-budget { color: #d32f2f; }
          .under-budget { color: #388e3c; }
        </style>
      </head>
      <body>
        <h1>Wedding Budget Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>Couple: ${couple?.partner1_name} & ${couple?.partner2_name || 'Partner'}</p>
        
        <div class="summary">
          <h2>Budget Summary</h2>
          <div class="summary-item">Total Budget: $${totalBudget.toLocaleString()}</div>
          <div class="summary-item">Total Spent: $${totalSpent.toLocaleString()}</div>
          <div class="summary-item ${totalRemaining >= 0 ? 'under-budget' : 'over-budget'}">
            Remaining: $${Math.abs(totalRemaining).toLocaleString()} ${totalRemaining < 0 ? '(Over Budget)' : ''}
          </div>
        </div>

        <h2>Budget Categories</h2>
        <table>
          <tr>
            <th>Category</th>
            <th>Allocated</th>
            <th>Spent</th>
            <th>Remaining</th>
            <th>%</th>
          </tr>
          ${categories.map(cat => `
            <tr>
              <td>${cat.name}</td>
              <td>$${cat.allocated_amount.toLocaleString()}</td>
              <td>$${cat.spent_amount.toLocaleString()}</td>
              <td class="${cat.allocated_amount - cat.spent_amount >= 0 ? 'under-budget' : 'over-budget'}">
                $${Math.abs(cat.allocated_amount - cat.spent_amount).toLocaleString()}
              </td>
              <td>${cat.allocated_amount > 0 ? Math.round((cat.spent_amount / cat.allocated_amount) * 100) : 0}%</td>
            </tr>
          `).join('')}
        </table>

        <h2>Recent Expenses</h2>
        <table>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
          ${expenses.slice(0, 20).map(expense => {
            const category = categories.find(c => c.id === expense.category_id)
            return `
              <tr>
                <td>${new Date(expense.date_incurred).toLocaleDateString()}</td>
                <td>${expense.description}</td>
                <td>${category?.name || 'Uncategorized'}</td>
                <td>$${expense.amount.toLocaleString()}</td>
                <td>${expense.payment_status || 'pending'}</td>
              </tr>
            `
          }).join('')}
        </table>
      </body>
      </html>
    `

    return html
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true)

    try {
      if (format === 'csv') {
        const csvContent = generateCSV()
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wedding-budget-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        addToast({
          title: 'Export successful',
          description: 'Your budget has been exported as CSV',
          type: 'success'
        })
      } else if (format === 'pdf') {
        // For PDF, we'll open the content in a new window for printing
        const pdfContent = generatePDFContent()
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(pdfContent)
          printWindow.document.close()
          printWindow.print()
        }

        addToast({
          title: 'PDF Ready',
          description: 'Use the print dialog to save as PDF',
          type: 'info'
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      addToast({
        title: 'Export failed',
        description: 'There was an error exporting your budget',
        type: 'error'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FilePdf className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}