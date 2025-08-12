#!/usr/bin/env tsx
import { OpenApiGenerator } from '../src/infrastructure/api/documentation/openApiGenerator';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

// Import your actual schemas here
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

async function generateDocs() {
  console.log('🚀 Generating API documentation...');

  const generator = new OpenApiGenerator({
    title: 'Wedding Planner API',
    description: 'Enterprise-grade wedding planning application API',
    version: '2.0.0',
    contact: {
      name: 'Wedding Planner Support',
      email: 'support@weddingplanner.com',
    },
    servers: [
      {
        url: 'http://localhost:4010',
        description: 'Development server',
      },
      {
        url: 'https://api.weddingplanner.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Guests', description: 'Guest management' },
      { name: 'Vendors', description: 'Vendor management' },
      { name: 'Budget', description: 'Budget tracking' },
      { name: 'Photos', description: 'Photo management' },
      { name: 'Dashboard', description: 'Dashboard and analytics' },
    ],
  });

  // Add schemas
  generator.addSchemaFromZod('Guest', guestSchema, 'Wedding guest information');
  generator.addSchemaFromZod('Vendor', vendorSchema, 'Vendor information');

  // Add endpoints based on your actual API
  // This is just an example - you would add all your actual endpoints
  generator.addEndpoint('/api/guests', 'GET', {
    summary: 'List all guests',
    description: 'Retrieve a paginated list of wedding guests',
    tags: ['Guests'],
    parameters: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1 },
      },
      {
        name: 'pageSize',
        in: 'query',
        schema: { type: 'integer', default: 20 },
      },
    ],
    responses: {
      200: {
        description: 'Successful response',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Guest' },
            },
          },
        },
      },
    },
  });

  generator.addEndpoint('/api/guests', 'POST', {
    summary: 'Create a new guest',
    description: 'Add a new guest to the wedding list',
    tags: ['Guests'],
    requestBody: {
      required: true,
      schema: guestSchema.omit({ id: true }),
    },
    responses: {
      201: {
        description: 'Guest created successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: '#/components/schemas/Guest' },
          },
        },
      },
    },
  });

  // Generate the specification
  const spec = generator.generate();

  // Save to multiple formats
  const outputDir = path.join(process.cwd(), 'docs', 'api');
  await fs.mkdir(outputDir, { recursive: true });

  // Save as JSON
  const jsonPath = path.join(outputDir, 'openapi.json');
  await fs.writeFile(jsonPath, JSON.stringify(spec, null, 2));
  console.log(`✅ Generated OpenAPI JSON: ${jsonPath}`);

  // Save as YAML (if you have js-yaml installed)
  try {
    const yaml = require('js-yaml');
    const yamlPath = path.join(outputDir, 'openapi.yaml');
    await fs.writeFile(yamlPath, yaml.dump(spec));
    console.log(`✅ Generated OpenAPI YAML: ${yamlPath}`);
  } catch (e) {
    console.log('⚠️  Skipping YAML generation (install js-yaml to enable)');
  }

  // Generate a simple HTML viewer
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wedding Planner API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; padding: 0; }
      #swagger-ui { padding: 20px; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        window.ui = SwaggerUIBundle({
          url: "./openapi.json",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout"
        });
      };
    </script>
</body>
</html>
  `;

  const htmlPath = path.join(outputDir, 'index.html');
  await fs.writeFile(htmlPath, htmlContent);
  console.log(`✅ Generated HTML viewer: ${htmlPath}`);

  console.log('\n📚 API documentation generated successfully!');
  console.log(`   View it at: http://localhost:4010/api-docs`);
  console.log(`   Or open: ${htmlPath}`);
}

// Run the generator
generateDocs().catch((error) => {
  console.error('❌ Error generating documentation:', error);
  process.exit(1);
});