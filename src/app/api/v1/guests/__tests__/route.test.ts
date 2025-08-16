/**
 * API Route tests for /api/v1/guests
 */

import { POST } from '../route';
import { createGuest } from '@/features/guests/service/guest.service';

// Mock the guest service
jest.mock('@/features/guests/service/guest.service', () => ({
  createGuest: jest.fn()
}));

describe('POST /api/v1/guests', () => {
  const mockCreateGuest = createGuest as jest.MockedFunction<typeof createGuest>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('201 Success responses', () => {
    it('should create guest with legacy format', async () => {
      const mockGuest = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
        relationship: 'friend',
        rsvpStatus: 'pending'
      };

      mockCreateGuest.mockResolvedValue(mockGuest);

      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          relationship: 'friend'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(response.headers.get('X-Handler')).toBe('app/api/v1/guests');
      expect(data).toEqual(mockGuest);
      expect(mockCreateGuest).toHaveBeenCalledWith({
        name: 'John Doe',
        hasPlusOne: false,
        relationship: 'friend',
        rsvpStatus: 'pending',
        email: 'john@example.com'
      });
    });

    it('should create guest with enterprise format', async () => {
      const mockGuest = {
        id: 'test-id-2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        relationship: 'family',
        rsvpStatus: 'confirmed'
      };

      mockCreateGuest.mockResolvedValue(mockGuest);

      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          relationship: 'family',
          rsvpStatus: 'confirmed'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(response.headers.get('X-Handler')).toBe('app/api/v1/guests');
      expect(data).toEqual(mockGuest);
      expect(mockCreateGuest).toHaveBeenCalledWith({
        name: 'Sarah Johnson',
        hasPlusOne: false,
        relationship: 'family',
        rsvpStatus: 'confirmed',
        email: 'sarah@example.com'
      });
    });

    it('should create guest with minimal required fields', async () => {
      const mockGuest = {
        id: 'test-id-3',
        name: 'Test Guest',
        relationship: 'colleague',
        rsvpStatus: 'pending'
      };

      mockCreateGuest.mockResolvedValue(mockGuest);

      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Guest',
          relationship: 'colleague'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockGuest);
      expect(mockCreateGuest).toHaveBeenCalledWith({
        name: 'Test Guest',
        hasPlusOne: false,
        relationship: 'colleague',
        rsvpStatus: 'pending'
      });
    });
  });

  describe('400 Validation error responses', () => {
    it('should return 400 when relationship is missing', async () => {
      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Guest'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get('X-Handler')).toBe('app/api/v1/guests');
      expect(data.errors).toHaveProperty('relationship');
      expect(data.errors.relationship).toBe('This field is required');
      expect(mockCreateGuest).not.toHaveBeenCalled();
    });

    it('should return 400 when name is missing in enterprise format', async () => {
      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          relationship: 'friend'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errors).toHaveProperty('name');
      expect(mockCreateGuest).not.toHaveBeenCalled();
    });

    it('should return 400 when firstName is missing in legacy format', async () => {
      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          lastName: 'Smith',
          relationship: 'family'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errors).toHaveProperty('firstName');
      expect(mockCreateGuest).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Guest',
          relationship: 'friend',
          email: 'invalid-email'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errors).toHaveProperty('email');
      expect(data.errors.email).toBe('Please enter a valid email address');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });
  });

  describe('404 Not found responses', () => {
    it('should return 404 when couple profile is not found', async () => {
      mockCreateGuest.mockRejectedValue(new Error('Couple profile not found'));

      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Guest',
          relationship: 'friend'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Couple profile not found. Please complete onboarding first.');
    });
  });

  describe('500 Server error responses', () => {
    it('should return 500 for unexpected errors', async () => {
      mockCreateGuest.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/v1/guests', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Guest',
          relationship: 'friend'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create guest');
    });
  });
});