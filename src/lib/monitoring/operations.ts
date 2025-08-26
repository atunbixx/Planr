import { logger } from '@/lib/logging/logger'
import { monitoring } from './metrics'

/**
 * Operation result interface
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  error?: Error
  duration?: number
  metadata?: Record<string, any>
}

/**
 * Monitoring utilities for key application operations
 * Provides consistent tracking for RSVP, messaging, and credit operations
 */
export class OperationMonitoring {
  /**
   * Monitor RSVP submission operations
   */
  public static async monitorRSVPSubmission<T>(
    operation: () => Promise<T>,
    context: {
      inviteId: string
      userId?: string
      isUpdate?: boolean
    }
  ): Promise<OperationResult<T>> {
    const timerName = `rsvp_submission_${context.inviteId}`
    const operationType = context.isUpdate ? 'update' : 'create'
    
    monitoring.startTimer(timerName)
    monitoring.incrementCounter('rsvp_submissions_attempted', 1, {
      type: operationType,
      inviteId: context.inviteId,
    })

    logger.info(
      `RSVP submission started`,
      {
        inviteId: context.inviteId,
        userId: context.userId,
        type: operationType,
      },
      'RSVPService',
      'submitRSVP'
    )

    try {
      const data = await operation()
      const duration = monitoring.endTimer(timerName, {
        status: 'success',
        type: operationType,
      })

      monitoring.incrementCounter('rsvp_submissions_successful', 1, {
        type: operationType,
        inviteId: context.inviteId,
      })

      if (duration) {
        monitoring.recordHistogram('rsvp_submission_duration', duration, {
          status: 'success',
          type: operationType,
        }, 'ms')
      }

      logger.info(
        `RSVP submission completed successfully`,
        {
          inviteId: context.inviteId,
          userId: context.userId,
          type: operationType,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'RSVPService',
        'submitRSVP'
      )

      return {
        success: true,
        data,
        duration,
        metadata: { type: operationType },
      }
    } catch (error) {
      const duration = monitoring.endTimer(timerName, {
        status: 'error',
        type: operationType,
      })

      monitoring.incrementCounter('rsvp_submissions_failed', 1, {
        type: operationType,
        inviteId: context.inviteId,
        error: error instanceof Error ? error.name : 'UnknownError',
      })

      if (duration) {
        monitoring.recordHistogram('rsvp_submission_duration', duration, {
          status: 'error',
          type: operationType,
        }, 'ms')
      }

      logger.error(
        `RSVP submission failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          inviteId: context.inviteId,
          userId: context.userId,
          type: operationType,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'RSVPService',
        'submitRSVP'
      )

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
        metadata: { type: operationType },
      }
    }
  }

  /**
   * Monitor messaging operations
   */
  public static async monitorMessagingOperation<T>(
    operation: () => Promise<T>,
    context: {
      userId: string
      provider: string
      messageType: 'email' | 'sms'
      recipientCount: number
      creditCost: number
    }
  ): Promise<OperationResult<T>> {
    const timerName = `messaging_${context.provider}_${Date.now()}`
    
    monitoring.startTimer(timerName)
    monitoring.incrementCounter('messaging_operations_attempted', 1, {
      provider: context.provider,
      messageType: context.messageType,
    })

    monitoring.setGauge('messaging_recipient_count', context.recipientCount, {
      provider: context.provider,
      messageType: context.messageType,
    })

    monitoring.recordHistogram('messaging_credit_cost', context.creditCost, {
      provider: context.provider,
      messageType: context.messageType,
    }, 'credits')

    logger.info(
      `Messaging operation started`,
      {
        userId: context.userId,
        provider: context.provider,
        messageType: context.messageType,
        recipientCount: context.recipientCount,
        creditCost: context.creditCost,
      },
      'MessagingService',
      'sendMessage'
    )

    try {
      const data = await operation()
      const duration = monitoring.endTimer(timerName, {
        status: 'success',
        provider: context.provider,
        messageType: context.messageType,
      })

      monitoring.incrementCounter('messaging_operations_successful', 1, {
        provider: context.provider,
        messageType: context.messageType,
      })

      monitoring.incrementCounter('messaging_credits_consumed', context.creditCost, {
        provider: context.provider,
        messageType: context.messageType,
        userId: context.userId,
      })

      if (duration) {
        monitoring.recordHistogram('messaging_operation_duration', duration, {
          status: 'success',
          provider: context.provider,
          messageType: context.messageType,
        }, 'ms')
      }

      logger.info(
        `Messaging operation completed successfully`,
        {
          userId: context.userId,
          provider: context.provider,
          messageType: context.messageType,
          recipientCount: context.recipientCount,
          creditCost: context.creditCost,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'MessagingService',
        'sendMessage'
      )

      return {
        success: true,
        data,
        duration,
        metadata: {
          provider: context.provider,
          messageType: context.messageType,
          creditCost: context.creditCost,
        },
      }
    } catch (error) {
      const duration = monitoring.endTimer(timerName, {
        status: 'error',
        provider: context.provider,
        messageType: context.messageType,
      })

      monitoring.incrementCounter('messaging_operations_failed', 1, {
        provider: context.provider,
        messageType: context.messageType,
        error: error instanceof Error ? error.name : 'UnknownError',
      })

      if (duration) {
        monitoring.recordHistogram('messaging_operation_duration', duration, {
          status: 'error',
          provider: context.provider,
          messageType: context.messageType,
        }, 'ms')
      }

      logger.error(
        `Messaging operation failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: context.userId,
          provider: context.provider,
          messageType: context.messageType,
          recipientCount: context.recipientCount,
          creditCost: context.creditCost,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'MessagingService',
        'sendMessage'
      )

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
        metadata: {
          provider: context.provider,
          messageType: context.messageType,
          creditCost: context.creditCost,
        },
      }
    }
  }

  /**
   * Monitor credit operations
   */
  public static async monitorCreditOperation<T>(
    operation: () => Promise<T>,
    context: {
      userId: string
      operationType: 'deduct' | 'add' | 'check'
      amount?: number
      reason?: string
    }
  ): Promise<OperationResult<T>> {
    const timerName = `credit_${context.operationType}_${context.userId}_${Date.now()}`
    
    monitoring.startTimer(timerName)
    monitoring.incrementCounter('credit_operations_attempted', 1, {
      type: context.operationType,
      userId: context.userId,
    })

    if (context.amount) {
      monitoring.recordHistogram('credit_operation_amount', context.amount, {
        type: context.operationType,
        userId: context.userId,
      }, 'credits')
    }

    logger.info(
      `Credit operation started`,
      {
        userId: context.userId,
        operationType: context.operationType,
        amount: context.amount,
        reason: context.reason,
      },
      'CreditRepository',
      context.operationType
    )

    try {
      const data = await operation()
      const duration = monitoring.endTimer(timerName, {
        status: 'success',
        type: context.operationType,
      })

      monitoring.incrementCounter('credit_operations_successful', 1, {
        type: context.operationType,
        userId: context.userId,
      })

      if (duration) {
        monitoring.recordHistogram('credit_operation_duration', duration, {
          status: 'success',
          type: context.operationType,
        }, 'ms')
      }

      logger.info(
        `Credit operation completed successfully`,
        {
          userId: context.userId,
          operationType: context.operationType,
          amount: context.amount,
          reason: context.reason,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'CreditRepository',
        context.operationType
      )

      return {
        success: true,
        data,
        duration,
        metadata: {
          operationType: context.operationType,
          amount: context.amount,
        },
      }
    } catch (error) {
      const duration = monitoring.endTimer(timerName, {
        status: 'error',
        type: context.operationType,
      })

      monitoring.incrementCounter('credit_operations_failed', 1, {
        type: context.operationType,
        userId: context.userId,
        error: error instanceof Error ? error.name : 'UnknownError',
      })

      if (duration) {
        monitoring.recordHistogram('credit_operation_duration', duration, {
          status: 'error',
          type: context.operationType,
        }, 'ms')
      }

      logger.error(
        `Credit operation failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: context.userId,
          operationType: context.operationType,
          amount: context.amount,
          reason: context.reason,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'CreditRepository',
        context.operationType
      )

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
        metadata: {
          operationType: context.operationType,
          amount: context.amount,
        },
      }
    }
  }

  /**
   * Monitor general database operations
   */
  public static async monitorDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: {
      table: string
      operationType: 'create' | 'read' | 'update' | 'delete' | 'query'
      userId?: string
    }
  ): Promise<OperationResult<T>> {
    const timerName = `db_${context.table}_${context.operationType}_${Date.now()}`
    
    monitoring.startTimer(timerName)
    monitoring.incrementCounter('database_operations_attempted', 1, {
      table: context.table,
      type: context.operationType,
    })

    logger.debug(
      `Database operation started`,
      {
        table: context.table,
        operationType: context.operationType,
        userId: context.userId,
      },
      'DatabaseRepository',
      context.operationType
    )

    try {
      const data = await operation()
      const duration = monitoring.endTimer(timerName, {
        status: 'success',
        table: context.table,
        type: context.operationType,
      })

      monitoring.incrementCounter('database_operations_successful', 1, {
        table: context.table,
        type: context.operationType,
      })

      if (duration) {
        monitoring.recordHistogram('database_operation_duration', duration, {
          status: 'success',
          table: context.table,
          type: context.operationType,
        }, 'ms')
      }

      logger.debug(
        `Database operation completed successfully`,
        {
          table: context.table,
          operationType: context.operationType,
          userId: context.userId,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'DatabaseRepository',
        context.operationType
      )

      return {
        success: true,
        data,
        duration,
        metadata: {
          table: context.table,
          operationType: context.operationType,
        },
      }
    } catch (error) {
      const duration = monitoring.endTimer(timerName, {
        status: 'error',
        table: context.table,
        type: context.operationType,
      })

      monitoring.incrementCounter('database_operations_failed', 1, {
        table: context.table,
        type: context.operationType,
        error: error instanceof Error ? error.name : 'UnknownError',
      })

      if (duration) {
        monitoring.recordHistogram('database_operation_duration', duration, {
          status: 'error',
          table: context.table,
          type: context.operationType,
        }, 'ms')
      }

      logger.error(
        `Database operation failed`,
        error instanceof Error ? error : new Error(String(error)),
        {
          table: context.table,
          operationType: context.operationType,
          userId: context.userId,
          duration: duration ? `${duration.toFixed(2)}ms` : undefined,
        },
        'DatabaseRepository',
        context.operationType
      )

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
        metadata: {
          table: context.table,
          operationType: context.operationType,
        },
      }
    }
  }
}

/**
 * Analytics event tracking
 */
export class AnalyticsTracking {
  /**
   * Track RSVP submission analytics
   */
  public static trackRSVPSubmission(context: {
    inviteId: string
    userId?: string
    isUpdate: boolean
    attendanceStatus: string
    guestCount: number
    responseTime?: number
  }): void {
    monitoring.incrementCounter('analytics_rsvp_submissions', 1, {
      attendanceStatus: context.attendanceStatus,
      isUpdate: context.isUpdate.toString(),
    })

    monitoring.recordHistogram('analytics_rsvp_guest_count', context.guestCount, {
      attendanceStatus: context.attendanceStatus,
    }, 'guests')

    if (context.responseTime) {
      monitoring.recordHistogram('analytics_rsvp_response_time', context.responseTime, {
        attendanceStatus: context.attendanceStatus,
      }, 'ms')
    }

    logger.info(
      'RSVP analytics event tracked',
      {
        inviteId: context.inviteId,
        userId: context.userId,
        isUpdate: context.isUpdate,
        attendanceStatus: context.attendanceStatus,
        guestCount: context.guestCount,
        responseTime: context.responseTime,
      },
      'AnalyticsTracking',
      'trackRSVPSubmission'
    )
  }

  /**
   * Track messaging analytics
   */
  public static trackMessagingEvent(context: {
    userId: string
    provider: string
    messageType: 'email' | 'sms'
    recipientCount: number
    creditCost: number
    success: boolean
    errorType?: string
  }): void {
    monitoring.incrementCounter('analytics_messaging_events', 1, {
      provider: context.provider,
      messageType: context.messageType,
      success: context.success.toString(),
      errorType: context.errorType || 'none',
    })

    monitoring.recordHistogram('analytics_messaging_recipients', context.recipientCount, {
      provider: context.provider,
      messageType: context.messageType,
    }, 'recipients')

    monitoring.recordHistogram('analytics_messaging_cost', context.creditCost, {
      provider: context.provider,
      messageType: context.messageType,
    }, 'credits')

    logger.info(
      'Messaging analytics event tracked',
      {
        userId: context.userId,
        provider: context.provider,
        messageType: context.messageType,
        recipientCount: context.recipientCount,
        creditCost: context.creditCost,
        success: context.success,
        errorType: context.errorType,
      },
      'AnalyticsTracking',
      'trackMessagingEvent'
    )
  }

  /**
   * Track vendor page views
   */
  public static trackVendorPageView(context: {
    vendorSlug: string
    userId?: string
    isSSR: boolean
    loadTime?: number
  }): void {
    monitoring.incrementCounter('analytics_vendor_page_views', 1, {
      vendorSlug: context.vendorSlug,
      renderType: context.isSSR ? 'ssr' : 'csr',
      authenticated: context.userId ? 'true' : 'false',
    })

    if (context.loadTime) {
      monitoring.recordHistogram('analytics_vendor_page_load_time', context.loadTime, {
        vendorSlug: context.vendorSlug,
        renderType: context.isSSR ? 'ssr' : 'csr',
      }, 'ms')
    }

    logger.info(
      'Vendor page view analytics event tracked',
      {
        vendorSlug: context.vendorSlug,
        userId: context.userId,
        isSSR: context.isSSR,
        loadTime: context.loadTime,
      },
      'AnalyticsTracking',
      'trackVendorPageView'
    )
  }
}