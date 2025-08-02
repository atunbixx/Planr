'use client'

import { useState } from 'react'
import { Guest } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { GUEST_CATEGORIES, RSVP_STATUSES } from '@/hooks/useGuests'

interface RSVPExportProps {
  guests: Guest[]
}

export function RSVPExport({ guests }: RSVPExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true)
    
    try {
      // CSV Headers
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Category',
        'RSVP Status',
        'Response Date',
        'Plus One Allowed',
        'Plus One Name',
        'Plus One Attending',
        'Meal Choice',
        'Dietary Restrictions',
        'Dietary Allergies',
        'Table Number',
        'Address',
        'City',
        'State',
        'Zip Code',
        'Country',
        'Notes',
        'Special Needs',
        'Accessibility Needs',
        'Gift Received',
        'Gift Description',
        'Thank You Sent'
      ]

      // Convert guests to CSV rows
      const rows = guests.map(guest => [
        guest.first_name,
        guest.last_name,
        guest.email || '',
        guest.phone || '',
        GUEST_CATEGORIES.find(c => c.value === guest.category)?.label || guest.category,
        RSVP_STATUSES.find(s => s.value === guest.rsvp_status)?.label || guest.rsvp_status,
        guest.rsvp_date ? format(new Date(guest.rsvp_date), 'yyyy-MM-dd') : '',
        guest.plus_one_allowed ? 'Yes' : 'No',
        guest.plus_one_name || '',
        guest.plus_one_attending ? 'Yes' : 'No',
        guest.meal_choice || '',
        guest.dietary_restrictions || '',
        guest.dietary_allergies || '',
        guest.table_number || '',
        guest.address || '',
        guest.city || '',
        guest.state || '',
        guest.zip_code || '',
        guest.country || '',
        guest.rsvp_notes || '',
        guest.special_needs || '',
        guest.accessibility_needs || '',
        guest.gift_received ? 'Yes' : 'No',
        guest.gift_description || '',
        guest.thank_you_sent ? 'Yes' : 'No'
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            // Escape commas and quotes in cell content
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `rsvp-list-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export to printable format
  const exportToPrint = () => {
    setIsExporting(true)
    
    try {
      // Group guests by RSVP status
      const attending = guests.filter(g => g.rsvp_status === 'attending')
      const notAttending = guests.filter(g => g.rsvp_status === 'not_attending')
      const pending = guests.filter(g => g.rsvp_status === 'pending')
      const maybe = guests.filter(g => g.rsvp_status === 'maybe')

      // Calculate stats
      const totalAttending = attending.length + attending.filter(g => g.plus_one_attending).length
      
      // Create printable HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>RSVP List - ${format(new Date(), 'MMMM d, yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1, h2 { color: #000; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { margin-bottom: 30px; }
            .stat-box { display: inline-block; margin: 0 20px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; }
            .stat-label { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .category { font-size: 12px; color: #666; }
            .plus-one { color: #4CAF50; }
            @media print { 
              .no-print { display: none; }
              h2 { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Wedding RSVP List</h1>
            <p>${format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-number">${guests.length}</div>
              <div class="stat-label">Total Invited</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${attending.length}</div>
              <div class="stat-label">Attending</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${totalAttending}</div>
              <div class="stat-label">Total with Plus Ones</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${notAttending.length}</div>
              <div class="stat-label">Not Attending</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${pending.length}</div>
              <div class="stat-label">Pending</div>
            </div>
          </div>
          
          ${attending.length > 0 ? `
            <h2>Attending (${attending.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Plus One</th>
                  <th>Meal Choice</th>
                  <th>Dietary Needs</th>
                  <th>Table</th>
                </tr>
              </thead>
              <tbody>
                ${attending.map(guest => `
                  <tr>
                    <td>
                      <strong>${guest.first_name} ${guest.last_name}</strong>
                      ${guest.email ? `<br><small>${guest.email}</small>` : ''}
                    </td>
                    <td class="category">${GUEST_CATEGORIES.find(c => c.value === guest.category)?.label || guest.category}</td>
                    <td>
                      ${guest.plus_one_attending ? `<span class="plus-one">✓ ${guest.plus_one_name || 'Yes'}</span>` : '-'}
                    </td>
                    <td>${guest.meal_choice || '-'}</td>
                    <td>${guest.dietary_restrictions || guest.dietary_allergies || '-'}</td>
                    <td>${guest.table_number || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${notAttending.length > 0 ? `
            <h2>Not Attending (${notAttending.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Response Date</th>
                </tr>
              </thead>
              <tbody>
                ${notAttending.map(guest => `
                  <tr>
                    <td><strong>${guest.first_name} ${guest.last_name}</strong></td>
                    <td class="category">${GUEST_CATEGORIES.find(c => c.value === guest.category)?.label || guest.category}</td>
                    <td>${guest.rsvp_date ? format(new Date(guest.rsvp_date), 'MMM d, yyyy') : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${pending.length > 0 ? `
            <h2>Pending Response (${pending.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Invitation Sent</th>
                </tr>
              </thead>
              <tbody>
                ${pending.map(guest => `
                  <tr>
                    <td><strong>${guest.first_name} ${guest.last_name}</strong></td>
                    <td class="category">${GUEST_CATEGORIES.find(c => c.value === guest.category)?.label || guest.category}</td>
                    <td>
                      ${guest.email || '-'}
                      ${guest.phone ? `<br>${guest.phone}` : ''}
                    </td>
                    <td>${guest.invitation_sent_date ? format(new Date(guest.invitation_sent_date), 'MMM d, yyyy') : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </body>
        </html>
      `

      // Open print dialog
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
      }
      
    } catch (error) {
      console.error('Error exporting to print:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export email list
  const exportEmailList = () => {
    setIsExporting(true)
    
    try {
      // Get unique emails
      const emails = guests
        .filter(g => g.email && g.rsvp_status === 'pending')
        .map(g => g.email)
        .filter((email, index, self) => self.indexOf(email) === index)

      // Create text file
      const content = emails.join('\n')
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `pending-rsvp-emails-${format(new Date(), 'yyyy-MM-dd')}.txt`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting email list:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        disabled={isExporting || guests.length === 0}
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPrint}
        disabled={isExporting || guests.length === 0}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Print List
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportEmailList}
        disabled={isExporting || guests.filter(g => g.email && g.rsvp_status === 'pending').length === 0}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        Email List
      </Button>
    </div>
  )
}