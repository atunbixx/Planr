import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../../../lib/api/base-handler'
import { createMockRequest, clearAllMocks } from '../test-utils'

// Mock implementation of BaseAPIHandler for testing
class TestAPIHandler extends BaseAPIHandler {
  public async testSuccessResponse(data: any, meta?: any) {
    return this.successResponse(data, meta)
  }

  public async testErrorResponse(code: string, message: string, status?: number) {
    return this.errorResponse(code, message, status)
  }

  public async testHandleError(error: unknown) {
    return this.handleError(error)
  }

  public async testValidateRequest(request: NextRequest) {
    return this.validateRequest(request)
  }

  public async testValidateRequiredFields(data: any, fields: string[]) {
    return this.validateRequiredFields(data, fields)
  }

  public async testGetPaginationParams(request: NextRequest) {
    return this.getPaginationParams(request)
  }
}

describe('BaseAPIHandler', () => {
  let handler: TestAPIHandler

  beforeEach(() => {
    clearAllMocks()
    handler = new TestAPIHandler()
  })

  describe('successResponse', () => {
    it('should return success response with data', () => {
      // Arrange
      const data = { id: '1', name: 'Test' }
      
      // Act
      const response = handler.testSuccessResponse(data)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })

    it('should return success response with data and meta', () => {
      // Arrange
      const data = [{ id: '1' }, { id: '2' }]
      const meta = { total: 2, page: 1 }
      
      // Act
      const response = handler.testSuccessResponse(data, meta)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })

    it('should handle empty data', () => {
      // Act
      const response = handler.testSuccessResponse(null)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(200)
    })
  })

  describe('errorResponse', () => {
    it('should return error response with default status 400', () => {
      // Act
      const response = handler.testErrorResponse('VALIDATION_ERROR', 'Invalid data')
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('should return error response with custom status', () => {
      // Act
      const response = handler.testErrorResponse('NOT_FOUND', 'Resource not found', 404)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(404)
    })

    it('should handle error codes correctly', () => {
      // Act
      const response1 = handler.testErrorResponse('UNAUTHORIZED', 'Unauthorized access', 401)
      const response2 = handler.testErrorResponse('INTERNAL_ERROR', 'Server error', 500)
      
      // Assert
      expect(response1.status).toBe(401)
      expect(response2.status).toBe(500)
    })
  })

  describe('handleError', () => {
    it('should handle Error objects', () => {
      // Arrange
      const error = new Error('Test error message')
      
      // Act
      const response = handler.testHandleError(error)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle Prisma unique constraint errors', () => {
      // Arrange
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed',
        meta: { target: ['email'] }
      }
      
      // Act
      const response = handler.testHandleError(prismaError)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(409)
    })

    it('should handle Prisma not found errors', () => {
      // Arrange
      const prismaError = {
        code: 'P2025',
        message: 'Record not found'
      }
      
      // Act
      const response = handler.testHandleError(prismaError)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(404)
    })

    it('should handle unknown errors', () => {
      // Arrange
      const unknownError = 'String error'
      
      // Act
      const response = handler.testHandleError(unknownError)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle validation errors', () => {
      // Arrange
      const validationError = {
        name: 'ValidationError',
        message: 'Invalid input',
        errors: [{ path: 'email', message: 'Invalid email' }]
      }
      
      // Act
      const response = handler.testHandleError(validationError)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })
  })

  describe('validateRequest', () => {
    it('should validate request with valid content type', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'test' })
      })
      
      // Act
      const result = await handler.testValidateRequest(request)
      
      // Assert
      expect(result.isValid).toBe(true)
    })

    it('should reject request with invalid content type for POST', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'invalid body'
      })
      
      // Act
      const result = await handler.testValidateRequest(request)
      
      // Assert
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Content-Type')
    })

    it('should validate GET requests without body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET'
      })
      
      // Act
      const result = await handler.testValidateRequest(request)
      
      // Assert
      expect(result.isValid).toBe(true)
    })

    it('should reject requests with missing required headers', async () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' })
        // Missing content-type header
      })
      
      // Act
      const result = await handler.testValidateRequest(request)
      
      // Assert
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateRequiredFields', () => {
    it('should pass validation when all required fields are present', () => {
      // Arrange
      const data = { name: 'John', email: 'john@example.com', age: 30 }
      const requiredFields = ['name', 'email']
      
      // Act
      const result = handler.testValidateRequiredFields(data, requiredFields)
      
      // Assert
      expect(result.isValid).toBe(true)
    })

    it('should fail validation when required fields are missing', () => {
      // Arrange
      const data = { name: 'John' }
      const requiredFields = ['name', 'email', 'phone']
      
      // Act
      const result = handler.testValidateRequiredFields(data, requiredFields)
      
      // Assert
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toEqual(['email', 'phone'])
    })

    it('should fail validation when required fields are null or undefined', () => {
      // Arrange
      const data = { name: 'John', email: null, phone: undefined, address: '' }
      const requiredFields = ['name', 'email', 'phone', 'address']
      
      // Act
      const result = handler.testValidateRequiredFields(data, requiredFields)
      
      // Assert
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toEqual(['email', 'phone', 'address'])
    })

    it('should handle empty required fields array', () => {
      // Arrange
      const data = { name: 'John' }
      const requiredFields: string[] = []
      
      // Act
      const result = handler.testValidateRequiredFields(data, requiredFields)
      
      // Assert
      expect(result.isValid).toBe(true)
    })

    it('should handle null data', () => {
      // Arrange
      const data = null
      const requiredFields = ['name']
      
      // Act
      const result = handler.testValidateRequiredFields(data, requiredFields)
      
      // Assert
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toEqual(['name'])
    })
  })

  describe('getPaginationParams', () => {
    it('should extract pagination parameters from query string', () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test?page=2&pageSize=50')
      
      // Act
      const result = handler.testGetPaginationParams(request)
      
      // Assert
      expect(result).toEqual({
        page: 2,
        pageSize: 50,
        skip: 50, // (page - 1) * pageSize
        take: 50
      })
    })

    it('should use default values when parameters are missing', () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test')
      
      // Act
      const result = handler.testGetPaginationParams(request)
      
      // Assert
      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        skip: 0,
        take: 20
      })
    })

    it('should handle invalid pagination parameters', () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test?page=invalid&pageSize=-5')
      
      // Act
      const result = handler.testGetPaginationParams(request)
      
      // Assert
      expect(result).toEqual({
        page: 1, // Default when invalid
        pageSize: 20, // Default when invalid
        skip: 0,
        take: 20
      })
    })

    it('should enforce maximum page size', () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test?pageSize=500')
      
      // Act
      const result = handler.testGetPaginationParams(request)
      
      // Assert
      expect(result.pageSize).toBe(100) // Maximum enforced
      expect(result.take).toBe(100)
    })

    it('should enforce minimum page number', () => {
      // Arrange
      const request = new NextRequest('http://localhost/api/test?page=0')
      
      // Act
      const result = handler.testGetPaginationParams(request)
      
      // Assert
      expect(result.page).toBe(1) // Minimum enforced
      expect(result.skip).toBe(0)
    })
  })

  describe('error handling edge cases', () => {
    it('should handle circular reference in error object', () => {
      // Arrange
      const circularError: any = { message: 'Circular error' }
      circularError.self = circularError
      
      // Act
      const response = handler.testHandleError(circularError)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('should handle error with no message', () => {
      // Arrange
      const error = {}
      
      // Act
      const response = handler.testHandleError(error)
      
      // Assert
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })
  })
})