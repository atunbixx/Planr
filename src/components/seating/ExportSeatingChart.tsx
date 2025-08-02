'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileImage, FileText, Loader2 } from 'lucide-react'
import { exportSeatingChart } from '@/utils/exportSeatingChart'
import { useToast } from '@/hooks/useToast'

interface ExportSeatingChartProps {
  elementId: string
  filename?: string
}

export function ExportSeatingChart({ elementId, filename }: ExportSeatingChartProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { addToast } = useToast()

  const handleExport = async (format: 'pdf' | 'png' | 'jpg') => {
    setIsExporting(true)

    try {
      await exportSeatingChart(elementId, {
        format,
        filename: filename || `seating-chart-${new Date().toISOString().split('T')[0]}`,
        scale: 2,
        quality: 0.95
      })

      addToast({
        title: 'Export successful',
        description: `Seating chart exported as ${format.toUpperCase()}`,
        type: 'success'
      })
    } catch (error) {
      console.error('Export failed:', error)
      addToast({
        title: 'Export failed',
        description: 'Unable to export seating chart. Please try again.',
        type: 'error'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <FileImage className="h-4 w-4 mr-2" />
          PNG Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('jpg')}>
          <FileImage className="h-4 w-4 mr-2" />
          JPG Image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}