import QRCode from 'qrcode';
import { Guest } from '@prisma/client';
import crypto from 'crypto';

export interface CheckInData {
  guestId: string;
  eventId: string;
  tableNumber?: string;
  timestamp: string;
  checkInCode: string;
}

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QRCodeService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate QR code for guest check-in
   */
  async generateGuestQRCode(
    guest: Guest,
    eventId: string,
    tableNumber?: string,
    options?: QRCodeOptions
  ): Promise<string> {
    const checkInData: CheckInData = {
      guestId: guest.id,
      eventId,
      tableNumber,
      timestamp: new Date().toISOString(),
      checkInCode: this.generateCheckInCode(guest.id, eventId),
    };

    // Create check-in URL
    const checkInUrl = `${this.baseUrl}/check-in?data=${this.encodeCheckInData(checkInData)}`;

    // Generate QR code
    const qrOptions = {
      width: options?.size || 300,
      margin: options?.margin || 4,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    };

    try {
      const dataUrl = await QRCode.toDataURL(checkInUrl, qrOptions);
      return dataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR codes for all guests in bulk
   */
  async generateBulkQRCodes(
    guests: Array<Guest & { tableNumber?: string }>,
    eventId: string,
    options?: QRCodeOptions
  ): Promise<Map<string, string>> {
    const qrCodes = new Map<string, string>();

    await Promise.all(
      guests.map(async (guest) => {
        try {
          const qrCode = await this.generateGuestQRCode(
            guest,
            eventId,
            guest.tableNumber,
            options
          );
          qrCodes.set(guest.id, qrCode);
        } catch (error) {
          console.error(`Failed to generate QR code for guest ${guest.id}:`, error);
        }
      })
    );

    return qrCodes;
  }

  /**
   * Generate printable QR code labels
   */
  async generateQRCodeLabels(
    guests: Array<Guest & { tableNumber?: string }>,
    eventId: string,
    options?: {
      labelsPerRow?: number;
      labelSize?: number;
      includeGuestName?: boolean;
      includeTableNumber?: boolean;
    }
  ): Promise<string> {
    const {
      labelsPerRow = 3,
      labelSize = 200,
      includeGuestName = true,
      includeTableNumber = true,
    } = options || {};

    const qrCodes = await this.generateBulkQRCodes(guests, eventId, {
      size: labelSize - 40, // Leave margin for text
    });

    // Generate HTML for printable labels
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { margin: 10mm; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
          }
          .labels-container {
            display: grid;
            grid-template-columns: repeat(${labelsPerRow}, 1fr);
            gap: 10px;
          }
          .label {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            page-break-inside: avoid;
          }
          .qr-code {
            margin: 10px auto;
          }
          .guest-name {
            font-weight: bold;
            margin-top: 5px;
          }
          .table-number {
            color: #666;
            font-size: 14px;
          }
          @media print {
            .label { border: 1px dashed #ccc; }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
    `;

    guests.forEach((guest) => {
      const qrCode = qrCodes.get(guest.id);
      if (qrCode) {
        html += `
          <div class="label">
            <img src="${qrCode}" class="qr-code" width="${labelSize - 40}" height="${labelSize - 40}" />
            ${includeGuestName ? `<div class="guest-name">${guest.name}</div>` : ''}
            ${includeTableNumber && guest.tableNumber ? `<div class="table-number">Table ${guest.tableNumber}</div>` : ''}
          </div>
        `;
      }
    });

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Decode check-in data from QR code
   */
  decodeCheckInData(encodedData: string): CheckInData {
    try {
      const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid QR code data');
    }
  }

  /**
   * Validate check-in data
   */
  validateCheckInData(data: CheckInData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.guestId) {
      errors.push('Guest ID is required');
    }

    if (!data.eventId) {
      errors.push('Event ID is required');
    }

    if (!data.checkInCode) {
      errors.push('Check-in code is required');
    }

    // Validate check-in code
    const expectedCode = this.generateCheckInCode(data.guestId, data.eventId);
    if (data.checkInCode !== expectedCode) {
      errors.push('Invalid check-in code');
    }

    // Check timestamp (prevent old QR codes)
    const timestamp = new Date(data.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      errors.push('QR code has expired');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate unique check-in code using secure cryptographic hash
   */
  private generateCheckInCode(guestId: string, eventId: string): string {
    // Ensure we have a proper secret key
    const secret = process.env.QR_CODE_SECRET;
    if (!secret || secret === 'default-secret') {
      throw new Error('QR_CODE_SECRET environment variable must be set to a secure value');
    }
    
    // Create HMAC-SHA256 hash for secure check-in code generation
    const data = `${guestId}-${eventId}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    
    // Return first 16 characters of hex digest for manageable QR code size
    return hmac.digest('hex').substring(0, 16);
  }

  /**
   * Encode check-in data for URL
   */
  private encodeCheckInData(data: CheckInData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  /**
   * Generate QR code for table
   */
  async generateTableQRCode(
    tableId: string,
    tableName: string,
    eventId: string,
    options?: QRCodeOptions
  ): Promise<string> {
    const tableData = {
      tableId,
      tableName,
      eventId,
      type: 'table',
      timestamp: new Date().toISOString(),
    };

    const tableUrl = `${this.baseUrl}/table-info?data=${Buffer.from(
      JSON.stringify(tableData)
    ).toString('base64')}`;

    const qrOptions = {
      width: options?.size || 400,
      margin: options?.margin || 4,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
    };

    try {
      const dataUrl = await QRCode.toDataURL(tableUrl, qrOptions);
      return dataUrl;
    } catch (error) {
      console.error('Table QR code generation error:', error);
      throw new Error('Failed to generate table QR code');
    }
  }
}

// Singleton instance
let qrCodeService: QRCodeService | null = null;

export function getQRCodeService(): QRCodeService {
  if (!qrCodeService) {
    qrCodeService = new QRCodeService();
  }
  return qrCodeService;
}