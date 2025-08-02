'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Download, FileImage, FileText, Loader2 } from 'lucide-react'
import { exportSeatingChart } from '@/utils/exportSeatingChart'
import { useToast } from '@/hooks/useToast'

interface ExportDialogProps {
  elementId: string
  printElementId?: string
  filename?: string
  children?: React.ReactNode
}

export function ExportDialog({ 
  elementId, 
  printElementId,
  filename,
  children 
}: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'visual' | 'print'>('visual')
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpg'>('pdf')
  const { addToast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const targetElementId = exportType === 'print' && printElementId ? printElementId : elementId
      
      await exportSeatingChart(targetElementId, {
        format,
        filename: filename || `seating-chart-${exportType}-${new Date().toISOString().split('T')[0]}`,
        scale: 2,
        quality: 0.95
      })

      addToast({
        title: 'Export successful',
        description: `Seating chart exported as ${format.toUpperCase()}`,
        type: 'success'
      })
      
      setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Seating Chart</DialogTitle>
          <DialogDescription>
            Choose your export preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Export Type */}
          {printElementId && (
            <div className="space-y-3">
              <Label>Export Type</Label>
              <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as 'visual' | 'print')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visual" id="visual" />
                  <Label htmlFor="visual" className="font-normal cursor-pointer">
                    Visual Layout (shows table positions)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="print" id="print" />
                  <Label htmlFor="print" className="font-normal cursor-pointer">
                    Print Layout (organized list)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'png' | 'jpg')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="font-normal cursor-pointer flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="font-normal cursor-pointer flex items-center">
                  <FileImage className="h-4 w-4 mr-2" />
                  PNG Image
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="jpg" />
                <Label htmlFor="jpg" className="font-normal cursor-pointer flex items-center">
                  <FileImage className="h-4 w-4 mr-2" />
                  JPG Image
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Format Info */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {format === 'pdf' && (
              <p>Best for printing and sharing. Maintains quality at any size.</p>
            )}
            {format === 'png' && (
              <p>High quality image with transparent background support.</p>
            )}
            {format === 'jpg' && (
              <p>Compressed image format, good for email and web.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}