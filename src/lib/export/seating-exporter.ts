import { jsPDF } from 'jspdf';
import { SeatingLayout, Table, Guest, SeatingAssignment } from '@prisma/client';
import { format } from 'date-fns';

// Dynamic import for client-side only
let html2canvas: any;

interface ExportOptions {
  format: 'pdf' | 'png' | 'csv';
  includeDietaryInfo?: boolean;
  includeContactInfo?: boolean;
  includeNotes?: boolean;
  includeTableDetails?: boolean;
  paperSize?: 'a4' | 'letter' | 'a3';
  orientation?: 'portrait' | 'landscape';
}

interface TableWithAssignments extends Table {
  assignments: (SeatingAssignment & {
    guest: Guest;
  })[];
}

interface LayoutWithDetails extends SeatingLayout {
  tables: TableWithAssignments[];
  couple: {
    partner1Name: string;
    partner2Name: string;
    weddingDate: Date;
    venueName?: string;
  };
}

export class SeatingChartExporter {
  private readonly PAPER_SIZES = {
    a4: { width: 210, height: 297 },
    letter: { width: 216, height: 279 },
    a3: { width: 297, height: 420 },
  };

  constructor(private layout: LayoutWithDetails) {}

  /**
   * Export seating chart based on format
   */
  async export(options: ExportOptions): Promise<Blob | string> {
    switch (options.format) {
      case 'pdf':
        return this.exportPDF(options);
      case 'png':
        return this.exportPNG(options);
      case 'csv':
        return this.exportCSV(options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Export as PDF with formatted layout
   */
  private async exportPDF(options: ExportOptions): Promise<Blob> {
    const paperSize = options.paperSize || 'a4';
    const orientation = options.orientation || 'landscape';
    const dimensions = this.PAPER_SIZES[paperSize];
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [dimensions.width, dimensions.height],
    });

    // Add header
    this.addPDFHeader(pdf);

    // Add venue layout visualization
    await this.addPDFLayout(pdf, options);

    // Add table listings
    this.addPDFTableListings(pdf, options);

    // Add summary statistics
    this.addPDFSummary(pdf);

    return pdf.output('blob');
  }

  /**
   * Add header to PDF
   */
  private addPDFHeader(pdf: jsPDF): void {
    const { couple } = this.layout;
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Seating Chart', pdf.internal.pageSize.width / 2, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `${couple.partner1Name} & ${couple.partner2Name}`,
      pdf.internal.pageSize.width / 2,
      30,
      { align: 'center' }
    );
    
    pdf.setFontSize(12);
    pdf.text(
      format(couple.weddingDate, 'MMMM d, yyyy'),
      pdf.internal.pageSize.width / 2,
      37,
      { align: 'center' }
    );
    
    if (couple.venueName) {
      pdf.text(couple.venueName, pdf.internal.pageSize.width / 2, 44, { align: 'center' });
    }
  }

  /**
   * Add venue layout visualization to PDF
   */
  private async addPDFLayout(pdf: jsPDF, options: ExportOptions): Promise<void> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Get canvas element if available
    const canvasElement = document.getElementById('venue-canvas');
    if (!canvasElement) return;

    try {
      // Dynamically import html2canvas for client-side only
      if (!html2canvas) {
        html2canvas = (await import('html2canvas')).default;
      }
      
      const canvas = await html2canvas(canvasElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Calculate dimensions to fit on page
      const margin = 10;
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight * 0.5; // Use half the page for layout
      
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = maxWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      // Center the image
      const x = (pageWidth - imgWidth) / 2;
      const y = 55; // Start below header
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Add new page for table listings if needed
      if (this.layout.tables.length > 0) {
        pdf.addPage();
      }
    } catch (error) {
      console.error('Error capturing canvas:', error);
    }
  }

  /**
   * Add table listings to PDF
   */
  private addPDFTableListings(pdf: jsPDF, options: ExportOptions): void {
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = pdf.internal.pageSize.height;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table Assignments', pdf.internal.pageSize.width / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Sort tables by name
    const sortedTables = [...this.layout.tables].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );

    sortedTables.forEach((table, index) => {
      // Check if we need a new page
      if (yPosition + (table.assignments.length + 2) * lineHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      // Table header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Table ${table.name}`, 20, yPosition);
      
      if (options.includeTableDetails) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`(Capacity: ${table.capacity}, Shape: ${table.shape})`, 80, yPosition);
      }
      yPosition += lineHeight;

      // Guest list for table
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      table.assignments.forEach((assignment, guestIndex) => {
        const guest = assignment.guest;
        let guestInfo = `${guestIndex + 1}. ${guest.name}`;
        
        if (options.includeDietaryInfo && guest.dietaryRestrictions) {
          guestInfo += ` (${guest.dietaryRestrictions})`;
        }
        
        if (options.includeContactInfo && (guest.email || guest.phone)) {
          const contact = [guest.email, guest.phone].filter(Boolean).join(', ');
          guestInfo += ` - ${contact}`;
        }
        
        pdf.text(guestInfo, 25, yPosition);
        yPosition += lineHeight;
        
        if (options.includeNotes && assignment.notes) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`Note: ${assignment.notes}`, 30, yPosition);
          yPosition += lineHeight;
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
        }
      });
      
      yPosition += 5; // Space between tables
    });
  }

  /**
   * Add summary statistics to PDF
   */
  private addPDFSummary(pdf: jsPDF): void {
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = pageHeight - 40;
    
    // Add separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const totalGuests = this.layout.tables.reduce((sum, table) => sum + table.assignments.length, 0);
    const totalCapacity = this.layout.tables.reduce((sum, table) => sum + table.capacity, 0);
    const utilizationRate = ((totalGuests / totalCapacity) * 100).toFixed(1);
    
    const summaryText = [
      `Total Tables: ${this.layout.tables.length}`,
      `Total Guests: ${totalGuests}`,
      `Total Capacity: ${totalCapacity}`,
      `Utilization: ${utilizationRate}%`,
    ];
    
    pdf.text(summaryText.join(' | '), pageWidth / 2, yPosition, { align: 'center' });
    
    // Add generation timestamp
    pdf.setFontSize(8);
    pdf.text(
      `Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
      pageWidth / 2,
      yPosition + 7,
      { align: 'center' }
    );
  }

  /**
   * Export as PNG image
   */
  private async exportPNG(options: ExportOptions): Promise<Blob> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('PNG export requires browser environment');
    }
    
    const canvasElement = document.getElementById('venue-canvas');
    if (!canvasElement) {
      throw new Error('Canvas element not found');
    }

    // Dynamically import html2canvas for client-side only
    if (!html2canvas) {
      html2canvas = (await import('html2canvas')).default;
    }
    
    const canvas = await html2canvas(canvasElement, {
      scale: 3, // Higher resolution
      backgroundColor: '#ffffff',
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Failed to generate PNG');
        }
      }, 'image/png', 0.95);
    });
  }

  /**
   * Export as CSV spreadsheet
   */
  private exportCSV(options: ExportOptions): string {
    const headers = ['Table', 'Seat #', 'Guest Name', 'Side', 'Age Group'];
    
    if (options.includeDietaryInfo) {
      headers.push('Dietary Restrictions');
    }
    
    if (options.includeContactInfo) {
      headers.push('Email', 'Phone');
    }
    
    if (options.includeNotes) {
      headers.push('Notes');
    }
    
    const rows = [headers];
    
    // Sort tables by name
    const sortedTables = [...this.layout.tables].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    
    sortedTables.forEach(table => {
      table.assignments.forEach((assignment, index) => {
        const guest = assignment.guest;
        const row = [
          table.name,
          (index + 1).toString(),
          guest.name,
          guest.side || '',
          guest.age_group || '',
        ];
        
        if (options.includeDietaryInfo) {
          row.push(guest.dietaryRestrictions || '');
        }
        
        if (options.includeContactInfo) {
          row.push(guest.email || '', guest.phone || '');
        }
        
        if (options.includeNotes) {
          row.push(assignment.notes || '');
        }
        
        rows.push(row);
      });
    });
    
    // Convert to CSV format
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quotes
        const escaped = cell.replace(/"/g, '""');
        return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');
  }

  /**
   * Generate filename based on format and date
   */
  static generateFilename(format: string, coupleName: string): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const safeName = coupleName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `seating-chart-${safeName}-${timestamp}.${format}`;
  }
}

/**
 * Helper function to download file
 */
export async function downloadSeatingChart(
  layout: LayoutWithDetails,
  options: ExportOptions
): Promise<void> {
  const exporter = new SeatingChartExporter(layout);
  const result = await exporter.export(options);
  
  const coupleName = `${layout.couple.partner1Name}-${layout.couple.partner2Name}`;
  const filename = SeatingChartExporter.generateFilename(options.format, coupleName);
  
  if (options.format === 'csv') {
    // CSV is a string
    const blob = new Blob([result as string], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  } else {
    // PDF and PNG are blobs
    downloadBlob(result as Blob, filename);
  }
}

/**
 * Trigger download of blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error('Download requires browser environment');
    return;
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}