import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import { messagingService } from '@/lib/messaging/messaging-service'
import type { SendMessageRequest, MessageRecipient } from '@/lib/messaging/types'
import { getSupabase } from '@/lib/supabase'

// Validation schemas
const sendMessageSchema = z.object({
  recipientIds: z.array(z.string()),
  recipientType: z.enum(['guest', 'vendor']),
  messageType: z.enum(['email', 'sms', 'whatsapp']),
  templateId: z.string().uuid().optional(),
  customSubject: z.string().optional(),
  customBody: z.string().optional(),
  variables: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional()
})

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['invitation', 'reminder', 'update', 'thank_you', 'custom']),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true)
})

const updateTemplateSchema = createTemplateSchema.partial()

export class MessagesSendHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate request
    const validatedData = sendMessageSchema.parse(body)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Fetch recipients based on type
    let recipients: MessageRecipient[] = []

    if (validatedData.recipientType === 'guest') {
      const guests = await prisma.guest.findMany({
        where: {
          coupleId: couple.id,
          id: { in: validatedData.recipientIds }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      })

      recipients = guests.map(guest => ({
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`.trim(),
        email: guest.email,
        phone: guest.phone,
        preferredChannel: validatedData.messageType
      }))
    } else if (validatedData.recipientType === 'vendor') {
      const vendors = await prisma.vendor.findMany({
        where: {
          coupleId: couple.id,
          id: { in: validatedData.recipientIds }
        },
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          phone: true
        }
      })

      recipients = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.contactName || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        preferredChannel: validatedData.messageType
      }))
    }

    if (recipients.length === 0) {
      return this.errorResponse('NO_RECIPIENTS', 'No valid recipients found', 400)
    }

    // Fetch template if provided
    let template = null
    if (validatedData.templateId) {
      const supabase = getSupabase()
      const { data: templateData, error: templateError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', validatedData.templateId)
        .eq('couple_id', couple.id)
        .single()

      if (templateError || !templateData) {
        return this.errorResponse('TEMPLATE_NOT_FOUND', 'Template not found', 404)
      }
      template = templateData
    }

    // If scheduled for future, save to scheduled_messages table
    if (validatedData.scheduledFor && new Date(validatedData.scheduledFor) > new Date()) {
      const supabase = getSupabase()
      const scheduledMessages = recipients.map(recipient => ({
        couple_id: couple.id,
        recipient_id: recipient.id,
        recipient_type: validatedData.recipientType,
        recipient_email: recipient.email,
        recipient_phone: recipient.phone,
        message_type: validatedData.messageType,
        template_id: validatedData.templateId,
        subject: validatedData.customSubject || template?.subject,
        body: validatedData.customBody || template?.body || '',
        variables: validatedData.variables || {},
        scheduled_for: validatedData.scheduledFor,
        status: 'scheduled'
      }))

      const { error: scheduleError } = await supabase
        .from('scheduled_messages')
        .insert(scheduledMessages)

      if (scheduleError) {
        console.error('Schedule error:', scheduleError)
        return this.errorResponse('SCHEDULE_FAILED', 'Failed to schedule messages', 500)
      }

      return this.successResponse({ 
        scheduled: true,
        count: recipients.length,
        scheduledFor: validatedData.scheduledFor 
      })
    }

    // Send messages immediately
    const results = []
    for (const recipient of recipients) {
      try {
        const messageRequest: SendMessageRequest = {
          to: recipient,
          type: validatedData.messageType,
          subject: validatedData.customSubject || template?.subject,
          body: validatedData.customBody || template?.body || '',
          template: template ? {
            id: template.id,
            name: template.name,
            type: template.type,
            subject: template.subject,
            body: template.body,
            variables: template.variables || []
          } : undefined,
          variables: validatedData.variables?.[recipient.id] || validatedData.variables || {}
        }

        const status = await messagingService.sendMessage(messageRequest)
        
        // Log the message
        await messagingService.logMessage(
          couple.id,
          recipient,
          validatedData.messageType,
          validatedData.customSubject || template?.subject,
          validatedData.customBody || template?.body || '',
          status,
          validatedData.templateId
        )

        results.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          status: status.status,
          messageId: status.messageId,
          error: status.error
        })
      } catch (error) {
        console.error(`Failed to send to ${recipient.name}:`, error)
        results.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return this.successResponse({
      totalRecipients: recipients.length,
      successCount,
      failedCount,
      results
    })
  }
}

export class MessagesLogsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'GET') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handleGet(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const messageType = searchParams.get('type')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query
    const supabase = getSupabase()
    let query = supabase
      .from('message_logs')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (messageType) {
      query = query.eq('message_type', messageType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching message logs:', error)
      return this.errorResponse('FETCH_FAILED', 'Failed to fetch message logs', 500)
    }

    // Get summary stats
    const stats = await this.getMessageStats(couple.id, startDate, endDate)

    return this.successResponse({
      logs: logs || [],
      stats,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
  }

  private async getMessageStats(coupleId: string, startDate?: string, endDate?: string) {
    const supabase = getSupabase()
    
    // Build base query
    let baseQuery = supabase
      .from('message_logs')
      .select('status, message_type', { count: 'exact' })
      .eq('couple_id', coupleId)

    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate)
    }

    if (endDate) {
      baseQuery = baseQuery.lte('created_at', endDate)
    }

    const { data, error } = await baseQuery

    if (error || !data) {
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {}
      }
    }

    // Calculate stats
    const stats = {
      total: data.length,
      sent: data.filter(log => log.status === 'sent').length,
      failed: data.filter(log => log.status === 'failed').length,
      pending: data.filter(log => log.status === 'pending').length,
      byType: data.reduce((acc, log) => {
        acc[log.message_type] = (acc[log.message_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return stats
  }
}

export class MessagesTemplatesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    const templateType = searchParams.get('type')
    const isActive = searchParams.get('active')

    // Get templates
    const supabase = getSupabase()
    let query = supabase
      .from('message_templates')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })

    if (templateType) {
      query = query.eq('type', templateType)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return this.errorResponse('FETCH_FAILED', 'Failed to fetch templates', 500)
    }

    // Also fetch default system templates
    const { data: systemTemplates } = await supabase
      .from('message_templates')
      .select('*')
      .is('couple_id', null)
      .eq('is_system', true)

    return this.successResponse({
      customTemplates: templates || [],
      systemTemplates: systemTemplates || []
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createTemplateSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Create template
    const supabase = getSupabase()
    const { data: template, error } = await supabase
      .from('message_templates')
      .insert({
        couple_id: couple.id,
        ...validatedData,
        is_system: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return this.errorResponse('CREATE_FAILED', 'Failed to create template', 500)
    }

    return this.successResponse(template, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const templateId = context?.params?.id

    if (!templateId) {
      return this.errorResponse('INVALID_REQUEST', 'Template ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const validatedData = updateTemplateSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Update template
    const supabase = getSupabase()
    const { data: template, error } = await supabase
      .from('message_templates')
      .update(validatedData)
      .eq('id', templateId)
      .eq('couple_id', couple.id)
      .select()
      .single()

    if (error || !template) {
      return this.errorResponse('NOT_FOUND', 'Template not found', 404)
    }

    return this.successResponse(template, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const templateId = context?.params?.id

    if (!templateId) {
      return this.errorResponse('INVALID_REQUEST', 'Template ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Delete template
    const supabase = getSupabase()
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId)
      .eq('couple_id', couple.id)

    if (error) {
      return this.errorResponse('DELETE_FAILED', 'Failed to delete template', 500)
    }

    return this.successResponse({ id: templateId }, { action: 'deleted' })
  }
}