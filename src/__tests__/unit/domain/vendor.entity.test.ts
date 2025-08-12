import { Vendor, VendorStatus, Money, ContactInfo } from '@/domain/vendor/vendor.entity'
import { BusinessError } from '@/core/errors'

describe('Vendor Entity', () => {
  describe('Money Value Object', () => {
    it('should create money with valid amount', () => {
      const money = new Money(100, 'USD')
      expect(money.amount).toBe(100)
      expect(money.currency).toBe('USD')
    })
    
    it('should throw error for negative amount', () => {
      expect(() => new Money(-100)).toThrow(BusinessError)
      expect(() => new Money(-100)).toThrow('Amount cannot be negative')
    })
    
    it('should add money with same currency', () => {
      const money1 = new Money(100)
      const money2 = new Money(50)
      const result = money1.add(money2)
      
      expect(result.amount).toBe(150)
      expect(result.currency).toBe('USD')
    })
    
    it('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'USD')
      const money2 = new Money(50, 'EUR')
      
      expect(() => money1.add(money2)).toThrow(BusinessError)
      expect(() => money1.add(money2)).toThrow('Cannot add money with different currencies')
    })
    
    it('should subtract money correctly', () => {
      const money1 = new Money(100)
      const money2 = new Money(30)
      const result = money1.subtract(money2)
      
      expect(result.amount).toBe(70)
    })
    
    it('should throw error for insufficient funds', () => {
      const money1 = new Money(30)
      const money2 = new Money(50)
      
      expect(() => money1.subtract(money2)).toThrow(BusinessError)
      expect(() => money1.subtract(money2)).toThrow('Insufficient funds')
    })
  })
  
  describe('ContactInfo Value Object', () => {
    it('should create contact info with valid data', () => {
      const contact = new ContactInfo(
        'John Doe',
        'john@example.com',
        '123-456-7890',
        'https://example.com'
      )
      
      expect(contact.name).toBe('John Doe')
      expect(contact.email).toBe('john@example.com')
      expect(contact.phone).toBe('123-456-7890')
      expect(contact.website).toBe('https://example.com')
    })
    
    it('should throw error for invalid email', () => {
      expect(() => new ContactInfo('John', 'invalid-email')).toThrow(BusinessError)
      expect(() => new ContactInfo('John', 'invalid-email')).toThrow('Invalid email format')
    })
    
    it('should throw error for invalid website', () => {
      expect(() => new ContactInfo('John', undefined, undefined, 'not-a-url'))
        .toThrow(BusinessError)
      expect(() => new ContactInfo('John', undefined, undefined, 'not-a-url'))
        .toThrow('Invalid website URL')
    })
  })
  
  describe('Vendor Aggregate', () => {
    const createVendor = (overrides?: Partial<any>) => {
      return new Vendor({
        id: 'vendor-1',
        coupleId: 'couple-1',
        categoryId: 'category-1',
        businessName: 'Test Vendor',
        contactInfo: new ContactInfo('John Doe', 'john@example.com'),
        ...overrides
      })
    }
    
    describe('Status Transitions', () => {
      it('should update status with valid transition', () => {
        const vendor = createVendor()
        expect(vendor.status).toBe(VendorStatus.POTENTIAL)
        
        vendor.updateStatus(VendorStatus.CONTACTED)
        expect(vendor.status).toBe(VendorStatus.CONTACTED)
        
        vendor.updateStatus(VendorStatus.QUOTE_REQUESTED)
        expect(vendor.status).toBe(VendorStatus.QUOTE_REQUESTED)
        
        vendor.updateStatus(VendorStatus.BOOKED)
        expect(vendor.status).toBe(VendorStatus.BOOKED)
        expect(vendor.contractSigned).toBe(true) // Auto-signed when booked
      })
      
      it('should throw error for invalid status transition', () => {
        const vendor = createVendor({ status: VendorStatus.POTENTIAL })
        
        expect(() => vendor.updateStatus(VendorStatus.COMPLETED))
          .toThrow(BusinessError)
        expect(() => vendor.updateStatus(VendorStatus.COMPLETED))
          .toThrow('Invalid status transition from potential to completed')
      })
      
      it('should not allow transitions from cancelled status', () => {
        const vendor = createVendor({ status: VendorStatus.CANCELLED })
        
        expect(() => vendor.updateStatus(VendorStatus.BOOKED))
          .toThrow(BusinessError)
      })
    })
    
    describe('Cost Management', () => {
      it('should set estimated cost', () => {
        const vendor = createVendor()
        const cost = new Money(5000)
        
        vendor.setEstimatedCost(cost)
        expect(vendor.estimatedCost).toEqual(cost)
      })
      
      it('should set actual cost', () => {
        const vendor = createVendor()
        const cost = new Money(5500)
        
        vendor.setActualCost(cost)
        expect(vendor.actualCost).toEqual(cost)
      })
      
      it('should throw error if estimated cost is higher than actual', () => {
        const vendor = createVendor()
        vendor.setActualCost(new Money(5000))
        
        expect(() => vendor.setEstimatedCost(new Money(6000)))
          .toThrow(BusinessError)
        expect(() => vendor.setEstimatedCost(new Money(6000)))
          .toThrow('Estimated cost cannot be higher than actual cost')
      })
      
      it('should calculate cost variance', () => {
        const vendor = createVendor()
        vendor.setEstimatedCost(new Money(5000))
        vendor.setActualCost(new Money(5500))
        
        const variance = vendor.getCostVariance()
        expect(variance).not.toBeNull()
        expect(variance?.amount).toBe(500)
      })
    })
    
    describe('Contract Management', () => {
      it('should sign contract for booked vendor', () => {
        const vendor = createVendor({ status: VendorStatus.BOOKED })
        expect(vendor.contractSigned).toBe(false)
        
        vendor.signContract()
        expect(vendor.contractSigned).toBe(true)
      })
      
      it('should throw error when signing contract for non-booked vendor', () => {
        const vendor = createVendor({ status: VendorStatus.CONTACTED })
        
        expect(() => vendor.signContract()).toThrow(BusinessError)
        expect(() => vendor.signContract()).toThrow('Can only sign contract for booked vendors')
      })
    })
    
    describe('Cancellation', () => {
      it('should cancel vendor with reason', () => {
        const vendor = createVendor({ status: VendorStatus.BOOKED })
        
        vendor.cancel('Found better option')
        expect(vendor.status).toBe(VendorStatus.CANCELLED)
        expect(vendor.notes).toContain('Cancellation reason: Found better option')
      })
      
      it('should not allow cancelling completed vendor', () => {
        const vendor = createVendor({ status: VendorStatus.COMPLETED })
        
        expect(() => vendor.cancel()).toThrow(BusinessError)
        expect(() => vendor.cancel()).toThrow('Cannot cancel completed vendor')
      })
    })
    
    describe('Active Status', () => {
      it('should return true for active vendors', () => {
        const activeStatuses = [
          VendorStatus.POTENTIAL,
          VendorStatus.CONTACTED,
          VendorStatus.QUOTE_REQUESTED,
          VendorStatus.IN_DISCUSSION,
          VendorStatus.BOOKED
        ]
        
        activeStatuses.forEach(status => {
          const vendor = createVendor({ status })
          expect(vendor.isActive()).toBe(true)
        })
      })
      
      it('should return false for inactive vendors', () => {
        const inactiveStatuses = [
          VendorStatus.CANCELLED,
          VendorStatus.COMPLETED
        ]
        
        inactiveStatuses.forEach(status => {
          const vendor = createVendor({ status })
          expect(vendor.isActive()).toBe(false)
        })
      })
    })
    
    describe('Persistence', () => {
      it('should convert to persistence model', () => {
        const vendor = createVendor({
          estimatedCost: new Money(5000),
          actualCost: new Money(5500)
        })
        
        const persistence = vendor.toPersistence()
        
        expect(persistence.id).toBe('vendor-1')
        expect(persistence.coupleId).toBe('couple-1')
        expect(persistence.name).toBe('Test Vendor')
        expect(persistence.contactName).toBe('John Doe')
        expect(persistence.email).toBe('john@example.com')
        expect(persistence.estimatedCost).toBe(5000)
        expect(persistence.actualCost).toBe(5500)
      })
      
      it('should create from persistence model', () => {
        const data = {
          id: 'vendor-1',
          coupleId: 'couple-1',
          categoryId: 'category-1',
          name: 'Test Vendor',
          contactName: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          website: 'https://example.com',
          status: VendorStatus.BOOKED,
          estimatedCost: 5000,
          actualCost: 5500,
          contractSigned: true,
          notes: 'Test notes',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const vendor = Vendor.fromPersistence(data)
        
        expect(vendor.id).toBe('vendor-1')
        expect(vendor.businessName).toBe('Test Vendor')
        expect(vendor.contactInfo.name).toBe('John Doe')
        expect(vendor.status).toBe(VendorStatus.BOOKED)
        expect(vendor.estimatedCost?.amount).toBe(5000)
        expect(vendor.actualCost?.amount).toBe(5500)
      })
    })
  })
})