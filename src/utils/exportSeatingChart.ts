import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg'
  filename?: string
  scale?: number
  quality?: number
}

export async function exportSeatingChart(
  elementId: string,
  options: ExportOptions
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const defaultFilename = `seating-chart-${new Date().toISOString().split('T')[0]}`
  const filename = options.filename || defaultFilename
  const scale = options.scale || 2
  const quality = options.quality || 0.95

  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })

    if (options.format === 'pdf') {
      // Export as PDF
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const imgData = canvas.toDataURL('image/png', quality)
      
      // Add image to PDF, centered
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      let finalWidth = imgWidth
      let finalHeight = imgHeight
      
      // Scale down if image is larger than page
      if (imgHeight > pageHeight - 20) {
        finalHeight = pageHeight - 20
        finalWidth = (canvas.width * finalHeight) / canvas.height
      }
      
      const xPos = (pageWidth - finalWidth) / 2
      const yPos = 10
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight)
      
      // Add title
      pdf.setFontSize(16)
      pdf.text('Seating Chart', pageWidth / 2, 8, { align: 'center' })
      
      pdf.save(`${filename}.pdf`)
    } else {
      // Export as image (PNG/JPG)
      const link = document.createElement('a')
      link.download = `${filename}.${options.format}`
      
      if (options.format === 'jpg') {
        // Convert to JPG
        const jpgCanvas = document.createElement('canvas')
        jpgCanvas.width = canvas.width
        jpgCanvas.height = canvas.height
        
        const ctx = jpgCanvas.getContext('2d')
        if (ctx) {
          // Fill white background for JPG
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height)
          ctx.drawImage(canvas, 0, 0)
          link.href = jpgCanvas.toDataURL('image/jpeg', quality)
        }
      } else {
        // PNG format
        link.href = canvas.toDataURL('image/png', quality)
      }
      
      link.click()
    }
  } catch (error) {
    console.error('Error exporting seating chart:', error)
    throw error
  }
}

// Helper function to prepare element for export
export function prepareElementForExport(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Temporarily adjust styles for better export quality
  const originalStyles = {
    transform: element.style.transform,
    position: element.style.position,
    width: element.style.width,
    height: element.style.height
  }

  // Reset any transforms and ensure proper sizing
  element.style.transform = 'none'
  element.style.position = 'relative'
  
  return () => {
    // Restore original styles
    Object.assign(element.style, originalStyles)
  }
}