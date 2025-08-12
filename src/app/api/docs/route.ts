import { NextRequest, NextResponse } from 'next/server';
import { OpenApiGenerator } from '@/infrastructure/api/documentation/openApiGenerator';
import { z } from 'zod';

// Example schemas for documentation
const guestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined']),
  plusOne: z.boolean(),
  dietaryRestrictions: z.string().optional(),
  tableNumber: z.number().optional(),
});

const budgetCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  budgetAmount: z.number().min(0),
  spentAmount: z.number().min(0),
  color: z.string(),
});

const vendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
  contractStatus: z.enum(['pending', 'signed', 'cancelled']),
  paymentStatus: z.enum(['pending', 'partial', 'paid']),
  totalAmount: z.number().min(0),
  paidAmount: z.number().min(0),
});

// Generate OpenAPI documentation
function generateApiDocs(): any {
  const generator = new OpenApiGenerator({
    title: 'Wedding Planner API',
    description: 'Enterprise-grade wedding planning application API with comprehensive features for managing guests, vendors, budget, and more.',
    version: '2.0.0',
    contact: {
      name: 'Wedding Planner Support',
      email: 'support@weddingplanner.com',
      url: 'https://weddingplanner.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4010',
        description: 'Current server',
      },
      {
        url: 'https://api.weddingplanner.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication and user management' },
      { name: 'Guests', description: 'Guest management operations' },
      { name: 'Vendors', description: 'Vendor management operations' },
      { name: 'Budget', description: 'Budget tracking and management' },
      { name: 'Photos', description: 'Photo gallery and album management' },
      { name: 'Messages', description: 'Communication and messaging' },
      { name: 'Dashboard', description: 'Dashboard and analytics' },
      { name: 'Settings', description: 'User and wedding settings' },
    ],
  });

  // Add schemas
  generator.addSchemaFromZod('Guest', guestSchema, 'Wedding guest information');
  generator.addSchemaFromZod('BudgetCategory', budgetCategorySchema, 'Budget category details');
  generator.addSchemaFromZod('Vendor', vendorSchema, 'Vendor information and status');

  // Guest endpoints
  generator.addEndpoint('/api/guests', 'GET', {
    summary: 'List all guests',
    description: 'Retrieve a paginated list of wedding guests with optional filtering',
    tags: ['Guests'],
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/PageSizeParam' },
      { $ref: '#/components/parameters/SortByParam' },
      { $ref: '#/components/parameters/SortOrderParam' },
      {
        name: 'rsvpStatus',
        in: 'query',
        description: 'Filter by RSVP status',
        schema: { type: 'string', enum: ['pending', 'confirmed', 'declined'] },
      },
      {
        name: 'search',
        in: 'query',
        description: 'Search guests by name or email',
        schema: { type: 'string' },
      },
    ],
    responses: {
      200: {
        description: 'List of guests retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Guest' },
            },
            metadata: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/guests', 'POST', {
    summary: 'Create a new guest',
    description: 'Add a new guest to the wedding guest list',
    tags: ['Guests'],
    requestBody: {
      description: 'Guest information',
      required: true,
      schema: guestSchema.omit({ id: true }),
    },
    responses: {
      201: {
        description: 'Guest created successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Guest' },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/guests/{id}', 'GET', {
    summary: 'Get guest by ID',
    description: 'Retrieve detailed information about a specific guest',
    tags: ['Guests'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Guest ID',
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      200: {
        description: 'Guest details retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Guest' },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/guests/{id}', 'PUT', {
    summary: 'Update guest',
    description: 'Update guest information',
    tags: ['Guests'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Guest ID',
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    requestBody: {
      description: 'Updated guest information',
      required: true,
      schema: guestSchema.partial().omit({ id: true }),
    },
    responses: {
      200: {
        description: 'Guest updated successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Guest' },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/guests/{id}', 'DELETE', {
    summary: 'Delete guest',
    description: 'Remove a guest from the wedding list',
    tags: ['Guests'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Guest ID',
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    responses: {
      204: {
        description: 'Guest deleted successfully',
      },
    },
  });

  // Vendor endpoints
  generator.addEndpoint('/api/vendors', 'GET', {
    summary: 'List all vendors',
    description: 'Retrieve a list of wedding vendors',
    tags: ['Vendors'],
    parameters: [
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/PageSizeParam' },
      {
        name: 'category',
        in: 'query',
        description: 'Filter by vendor category',
        schema: { type: 'string' },
      },
      {
        name: 'contractStatus',
        in: 'query',
        description: 'Filter by contract status',
        schema: { type: 'string', enum: ['pending', 'signed', 'cancelled'] },
      },
    ],
    responses: {
      200: {
        description: 'List of vendors retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Vendor' },
            },
            metadata: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/vendors', 'POST', {
    summary: 'Create a new vendor',
    description: 'Add a new vendor to the wedding vendor list',
    tags: ['Vendors'],
    requestBody: {
      description: 'Vendor information',
      required: true,
      schema: vendorSchema.omit({ id: true }),
    },
    responses: {
      201: {
        description: 'Vendor created successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Vendor' },
          },
        },
      },
    },
  });

  // Budget endpoints
  generator.addEndpoint('/api/budget/categories', 'GET', {
    summary: 'List budget categories',
    description: 'Retrieve all budget categories with spending information',
    tags: ['Budget'],
    responses: {
      200: {
        description: 'Budget categories retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/BudgetCategory' },
            },
            metadata: {
              type: 'object',
              properties: {
                totalBudget: { type: 'number' },
                totalSpent: { type: 'number' },
                remainingBudget: { type: 'number' },
              },
            },
          },
        },
      },
    },
  });

  // Dashboard endpoints
  generator.addEndpoint('/api/dashboard/stats', 'GET', {
    summary: 'Get dashboard statistics',
    description: 'Retrieve key statistics for the wedding dashboard',
    tags: ['Dashboard'],
    responses: {
      200: {
        description: 'Dashboard statistics retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                daysUntilWedding: { type: 'integer' },
                guestStats: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    confirmed: { type: 'integer' },
                    pending: { type: 'integer' },
                    declined: { type: 'integer' },
                  },
                },
                budgetStats: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    spent: { type: 'number' },
                    remaining: { type: 'number' },
                    percentageUsed: { type: 'number' },
                  },
                },
                vendorStats: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    booked: { type: 'integer' },
                    pending: { type: 'integer' },
                  },
                },
                taskStats: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    completed: { type: 'integer' },
                    overdue: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Add versioned endpoints example
  generator.addEndpoint('/api/v1/guests', 'GET', {
    summary: 'List all guests (v1)',
    description: 'Retrieve a list of wedding guests - Version 1 (Deprecated)',
    tags: ['Guests'],
    deprecated: true,
    'x-api-version': '1.0',
    responses: {
      200: {
        description: 'List of guests retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
  });

  return generator.generate();
}

export async function GET(request: NextRequest) {
  const spec = generateApiDocs();
  
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}