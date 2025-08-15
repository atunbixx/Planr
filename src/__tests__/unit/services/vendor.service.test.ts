import { VendorService } from '@/features/vendors/service/vendor.service'
import { IVendorRepository } from '@/infrastructure/persistence/vendor.repository'
import { Vendor, VendorStatus, Money, ContactInfo } from '@/domain/vendor/vendor.entity'
import { NotFoundError, BusinessError } from '@/core/errors'
import { createMockUserContext } from '@/core/testing/test-helpers'
import { recordBusinessOperation } from '@/core/monitoring/metrics'

// Mock dependencies
jest.mock('@/core/monitoring/metrics')
jest.mock('@/core/logging/logger')

describe('VendorService', () => {
  let vendorService: VendorService
  let mockVendorRepository: jest.Mocked<IVendorRepository>
  let mockUser: ReturnType<typeof createMockUserContext>
  
  beforeEach(() => {
    // Create mock repository
    mockVendorRepository = {
      findById: jest.fn(),
      findByCoupleId: jest.fn(),
      findByStatus: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    }
    
    // Create service instance
    vendorService = new VendorService(mockVendorRepository)
    
    // Create mock user
    mockUser = createMockUserContext({
      coupleId: 'couple-123'
    })
    
    // Reset mocks
    jest.clearAllMocks()
  })
  
  describe('getVendorsByCouple', () => {
    it('should return vendors for a couple', async () => {
      const mockVendors = [
        new Vendor({
          id: 'vendor-1',
          coupleId: 'couple-123',
          categoryId: 'cat-1',
          businessName: 'Vendor 1',
          contactInfo: new ContactInfo('Contact 1', 'vendor1@example.com')
        }),
        new Vendor({
          id: 'vendor-2',
          coupleId: 'couple-123',
          categoryId: 'cat-2',
          businessName: 'Vendor 2',
          contactInfo: new ContactInfo('Contact 2', 'vendor2@example.com')
        })
      ]
      
      mockVendorRepository.findByCoupleId.mockResolvedValue(mockVendors)
      
      const result = await vendorService.getVendorsByCouple('couple-123')
      
      expect(result).toEqual(mockVendors)
      expect(mockVendorRepository.findByCoupleId).toHaveBeenCalledWith('couple-123')
      expect(recordBusinessOperation).toHaveBeenCalledWith(
        'getVendorsByCouple',
        'success',
        expect.any(Number)
      )
    })
    
    it('should record failure metric on error', async () => {
      mockVendorRepository.findByCoupleId.mockRejectedValue(new Error('Database error'))
      
      await expect(vendorService.getVendorsByCouple('couple-123'))
        .rejects.toThrow('Database error')
      
      expect(recordBusinessOperation).toHaveBeenCalledWith(
        'getVendorsByCouple',
        'failure',
        expect.any(Number)
      )
    })
  })
  
  describe('getVendor', () => {
    it('should return vendor if found and owned by user', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com')
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      
      const result = await vendorService.getVendor('vendor-1', mockUser)
      
      expect(result).toEqual(mockVendor)
      expect(mockVendorRepository.findById).toHaveBeenCalledWith('vendor-1')
    })
    
    it('should throw NotFoundError if vendor not found', async () => {
      mockVendorRepository.findById.mockResolvedValue(null)
      
      await expect(vendorService.getVendor('vendor-1', mockUser))
        .rejects.toThrow(NotFoundError)
      await expect(vendorService.getVendor('vendor-1', mockUser))
        .rejects.toThrow('Vendor with identifier \'vendor-1\' not found')
    })
    
    it('should throw BusinessError if vendor not owned by user', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'different-couple',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com')
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      
      await expect(vendorService.getVendor('vendor-1', mockUser))
        .rejects.toThrow(BusinessError)
      await expect(vendorService.getVendor('vendor-1', mockUser))
        .rejects.toThrow('Access denied to vendor')
    })
  })
  
  describe('updateVendorStatus', () => {
    it('should update vendor status', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com'),
        status: VendorStatus.POTENTIAL
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      mockVendorRepository.save.mockResolvedValue()
      
      await vendorService.updateVendorStatus('vendor-1', VendorStatus.CONTACTED, mockUser)
      
      expect(mockVendor.status).toBe(VendorStatus.CONTACTED)
      expect(mockVendorRepository.save).toHaveBeenCalledWith(mockVendor)
    })
    
    it('should throw error for invalid status transition', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com'),
        status: VendorStatus.POTENTIAL
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      
      await expect(
        vendorService.updateVendorStatus('vendor-1', VendorStatus.COMPLETED, mockUser)
      ).rejects.toThrow(BusinessError)
    })
  })
  
  describe('updateVendorCost', () => {
    it('should update estimated cost', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com')
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      mockVendorRepository.save.mockResolvedValue()
      
      await vendorService.updateVendorCost('vendor-1', 'estimated', 5000, mockUser)
      
      expect(mockVendor.estimatedCost?.amount).toBe(5000)
      expect(mockVendorRepository.save).toHaveBeenCalledWith(mockVendor)
    })
    
    it('should update actual cost', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com')
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      mockVendorRepository.save.mockResolvedValue()
      
      await vendorService.updateVendorCost('vendor-1', 'actual', 5500, mockUser)
      
      expect(mockVendor.actualCost?.amount).toBe(5500)
      expect(mockVendorRepository.save).toHaveBeenCalledWith(mockVendor)
    })
  })
  
  describe('signContract', () => {
    it('should sign contract for booked vendor', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com'),
        status: VendorStatus.BOOKED
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      mockVendorRepository.save.mockResolvedValue()
      
      await vendorService.signContract('vendor-1', mockUser)
      
      expect(mockVendor.contractSigned).toBe(true)
      expect(mockVendorRepository.save).toHaveBeenCalledWith(mockVendor)
    })
  })
  
  describe('cancelVendor', () => {
    it('should cancel vendor with reason', async () => {
      const mockVendor = new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-123',
        categoryId: 'cat-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('Contact', 'vendor@example.com'),
        status: VendorStatus.BOOKED
      })
      
      mockVendorRepository.findById.mockResolvedValue(mockVendor)
      mockVendorRepository.save.mockResolvedValue()
      
      await vendorService.cancelVendor('vendor-1', 'Found better option', mockUser)
      
      expect(mockVendor.status).toBe(VendorStatus.CANCELLED)
      expect(mockVendor.notes).toContain('Found better option')
      expect(mockVendorRepository.save).toHaveBeenCalledWith(mockVendor)
    })
  })
  
  describe('getVendorStatistics', () => {
    it('should calculate vendor statistics correctly', async () => {
      const mockVendors = [
        new Vendor({
          id: 'vendor-1',
          coupleId: 'couple-123',
          categoryId: 'cat-1',
          businessName: 'Vendor 1',
          contactInfo: new ContactInfo('Contact 1', 'vendor1@example.com'),
          status: VendorStatus.BOOKED,
          estimatedCost: new Money(5000),
          actualCost: new Money(5500),
          contractSigned: true
        }),
        new Vendor({
          id: 'vendor-2',
          coupleId: 'couple-123',
          categoryId: 'cat-2',
          businessName: 'Vendor 2',
          contactInfo: new ContactInfo('Contact 2', 'vendor2@example.com'),
          status: VendorStatus.COMPLETED,
          estimatedCost: new Money(3000),
          actualCost: new Money(2800)
        }),
        new Vendor({
          id: 'vendor-3',
          coupleId: 'couple-123',
          categoryId: 'cat-3',
          businessName: 'Vendor 3',
          contactInfo: new ContactInfo('Contact 3', 'vendor3@example.com'),
          status: VendorStatus.POTENTIAL
        })
      ]
      
      mockVendorRepository.findByCoupleId.mockResolvedValue(mockVendors)
      
      const stats = await vendorService.getVendorStatistics('couple-123')
      
      expect(stats).toEqual({
        total: 3,
        byStatus: {
          [VendorStatus.POTENTIAL]: 1,
          [VendorStatus.CONTACTED]: 0,
          [VendorStatus.QUOTE_REQUESTED]: 0,
          [VendorStatus.IN_DISCUSSION]: 0,
          [VendorStatus.BOOKED]: 1,
          [VendorStatus.CANCELLED]: 0,
          [VendorStatus.COMPLETED]: 1
        },
        totalEstimatedCost: 8000,
        totalActualCost: 8300,
        contractsSigned: 1,
        costVariance: 300,
        completionRate: 50 // 1 completed out of 2 active (excluding potential)
      })
    })
  })
})