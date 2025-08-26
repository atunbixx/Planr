import { logger, LogLevel } from '../logger'
import { monitoring } from '../../monitoring/metrics'

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
}

const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}

describe('Logger', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    Object.assign(console, mockConsole)
    
    // Clear all mocks
    Object.values(mockConsole).forEach(mock => mock.mockClear())
    
    // Reset logger configuration
    logger.updateConfig({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableStructured: false,
      maskSensitiveData: true,
    })
    
    // Clear request ID
    logger.clearRequestId()
  })

  afterEach(() => {
    // Restore original console methods
    Object.assign(console, originalConsole)
  })

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message', { key: 'value' }, 'TestService', 'testOperation')
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG Test debug message (TestService::testOperation)'),
        { key: 'value' }
      )
    })

    it('should log info messages', () => {
      logger.info('Test info message', { key: 'value' }, 'TestService', 'testOperation')
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO Test info message (TestService::testOperation)'),
        { key: 'value' }
      )
    })

    it('should log warning messages', () => {
      logger.warn('Test warning message', { key: 'value' }, 'TestService', 'testOperation')
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN Test warning message (TestService::testOperation)'),
        { key: 'value' }
      )
    })

    it('should log error messages with error objects', () => {
      const error = new Error('Test error')
      logger.error('Test error message', error, { key: 'value' }, 'TestService', 'testOperation')
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR Test error message (TestService::testOperation)'),
        expect.objectContaining({
          key: 'value',
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
          })
        }),
        ''
      )
    })
  })

  describe('Log Level Filtering', () => {
    it('should respect log level configuration', () => {
      logger.updateConfig({ level: LogLevel.WARN })
      
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')
      
      expect(mockConsole.debug).not.toHaveBeenCalled()
      expect(mockConsole.info).not.toHaveBeenCalled()
      expect(mockConsole.warn).toHaveBeenCalled()
      expect(mockConsole.error).toHaveBeenCalled()
    })
  })

  describe('Sensitive Data Masking', () => {
    it('should mask email addresses', () => {
      const context = {
        email: 'user@example.com',
        userEmail: 'test@domain.com',
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.email).toBe('us***@example.com')
      expect(loggedContext.userEmail).toBe('te***@domain.com')
    })

    it('should mask phone numbers', () => {
      const context = {
        phone: '1234567890',
        phoneNumber: '+1-555-123-4567',
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.phone).toBe('***7890')
      expect(loggedContext.phoneNumber).toBe('***4567')
    })

    it('should mask passwords and tokens', () => {
      const context = {
        password: 'secret123',
        token: 'abc123def456',
        apiKey: 'key_123456789',
        secret: 'topsecret',
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.password).toBe('***MASKED***')
      expect(loggedContext.token).toBe('***MASKED***')
      expect(loggedContext.apiKey).toBe('***MASKED***')
      expect(loggedContext.secret).toBe('***MASKED***')
    })

    it('should not mask data when masking is disabled', () => {
      logger.updateConfig({ maskSensitiveData: false })
      
      const context = {
        email: 'user@example.com',
        password: 'secret123',
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.email).toBe('user@example.com')
      expect(loggedContext.password).toBe('secret123')
    })
  })

  describe('Request ID Tracking', () => {
    it('should include request ID in log entries', () => {
      const requestId = 'req_123456'
      logger.setRequestId(requestId)
      
      logger.info('Test message')
      
      // Check that the log includes request ID context
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO Test message'),
        ''
      )
    })

    it('should clear request ID', () => {
      logger.setRequestId('req_123456')
      logger.clearRequestId()
      
      logger.info('Test message')
      
      // Request ID should not be included after clearing
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO Test message'),
        ''
      )
    })
  })

  describe('Structured Logging', () => {
    it('should output structured logs when enabled', () => {
      logger.updateConfig({ enableStructured: true })
      
      logger.info('Test message', { key: 'value' }, 'TestService', 'testOperation')
      
      // Should output both console and structured logs
      expect(mockConsole.info).toHaveBeenCalled()
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('\"message\":\"Test message\"')
      )
    })
  })

  describe('Nested Object Masking', () => {
    it('should mask sensitive data in nested objects', () => {
      const context = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '1234567890',
          }
        },
        auth: {
          password: 'secret123',
          token: 'abc123',
        }
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.user.email).toBe('us***@example.com')
      expect(loggedContext.user.profile.phone).toBe('***7890')
      expect(loggedContext.auth.password).toBe('***MASKED***')
      expect(loggedContext.auth.token).toBe('***MASKED***')
    })

    it('should handle arrays with sensitive data', () => {
      const context = {
        users: [
          { email: 'user1@example.com', password: 'secret1' },
          { email: 'user2@example.com', password: 'secret2' },
        ]
      }
      
      logger.info('Test message', context)
      
      const loggedContext = mockConsole.info.mock.calls[0][1]
      expect(loggedContext.users[0].email).toBe('us***@example.com')
      expect(loggedContext.users[0].password).toBe('***MASKED***')
      expect(loggedContext.users[1].email).toBe('us***@example.com')
      expect(loggedContext.users[1].password).toBe('***MASKED***')
    })
  })
})