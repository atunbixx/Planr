import { z } from 'zod';

interface OpenApiConfig {
  title: string;
  description: string;
  version: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
  servers?: Array<{
    url: string;
    description: string;
  }>;
  tags?: Array<{
    name: string;
    description: string;
  }>;
}

type Parameter = {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: any;
} | {
  $ref: string;
}

interface RequestBody {
  description?: string;
  required?: boolean;
  schema?: any;
}

interface Response {
  description: string;
  schema?: any;
}

interface EndpointConfig {
  summary: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string | number, Response>;
  deprecated?: boolean;
  'x-api-version'?: string;
}

export class OpenApiGenerator {
  private spec: any;
  private schemas: Record<string, any> = {};
  private paths: Record<string, any> = {};

  constructor(config: OpenApiConfig) {
    this.spec = {
      openapi: '3.0.3',
      info: {
        title: config.title,
        description: config.description,
        version: config.version,
        contact: config.contact,
        license: config.license,
      },
      servers: config.servers || [],
      tags: config.tags || [],
      paths: {},
      components: {
        schemas: {},
        parameters: {
          PageParam: {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1,
            },
          },
          PageSizeParam: {
            name: 'pageSize',
            in: 'query',
            description: 'Number of items per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          SortByParam: {
            name: 'sortBy',
            in: 'query',
            description: 'Field to sort by',
            schema: {
              type: 'string',
            },
          },
          SortOrderParam: {
            name: 'sortOrder',
            in: 'query',
            description: 'Sort order',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc',
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    };
  }

  /**
   * Add a schema from a Zod schema
   */
  addSchemaFromZod(name: string, zodSchema: z.ZodType<any>, description?: string): void {
    const jsonSchema = this.zodToJsonSchema(zodSchema);
    if (description) {
      jsonSchema.description = description;
    }
    this.schemas[name] = jsonSchema;
    this.spec.components.schemas[name] = jsonSchema;
  }

  /**
   * Add an API endpoint
   */
  addEndpoint(path: string, method: string, config: EndpointConfig): void {
    if (!this.paths[path]) {
      this.paths[path] = {};
    }

    const operation: any = {
      summary: config.summary,
      description: config.description,
      tags: config.tags,
      parameters: config.parameters,
      responses: {},
    };

    if (config.deprecated) {
      operation.deprecated = true;
    }

    if (config['x-api-version']) {
      operation['x-api-version'] = config['x-api-version'];
    }

    // Handle request body
    if (config.requestBody) {
      operation.requestBody = {
        description: config.requestBody.description,
        required: config.requestBody.required,
        content: {
          'application/json': {
            schema: this.processSchema(config.requestBody.schema),
          },
        },
      };
    }

    // Handle responses
    for (const [statusCode, response] of Object.entries(config.responses)) {
      operation.responses[statusCode] = {
        description: response.description,
      };

      if (response.schema) {
        operation.responses[statusCode].content = {
          'application/json': {
            schema: this.processSchema(response.schema),
          },
        };
      }
    }

    this.paths[path][method.toLowerCase()] = operation;
    this.spec.paths = this.paths;
  }

  /**
   * Generate the complete OpenAPI specification
   */
  generate(): any {
    return JSON.parse(JSON.stringify(this.spec));
  }

  /**
   * Convert Zod schema to JSON Schema
   */
  private zodToJsonSchema(zodSchema: z.ZodType<any>): any {
    // This is a simplified conversion - in a real implementation,
    // you might want to use a library like zod-to-json-schema
    if (zodSchema instanceof z.ZodObject) {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      const shape = zodSchema.shape;

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodToJsonSchema(value as z.ZodType<any>);
        if (!(value as any).isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    if (zodSchema instanceof z.ZodString) {
      const schema: any = { type: 'string' };
      
      // Handle string validations
      const checks = (zodSchema as any)._def.checks || [];
      for (const check of checks) {
        if (check.kind === 'min') {
          schema.minLength = check.value;
        } else if (check.kind === 'max') {
          schema.maxLength = check.value;
        } else if (check.kind === 'email') {
          schema.format = 'email';
        } else if (check.kind === 'url') {
          schema.format = 'uri';
        } else if (check.kind === 'uuid') {
          schema.format = 'uuid';
        }
      }
      
      return schema;
    }

    if (zodSchema instanceof z.ZodNumber) {
      const schema: any = { type: 'number' };
      
      // Handle number validations
      const checks = (zodSchema as any)._def.checks || [];
      for (const check of checks) {
        if (check.kind === 'min') {
          schema.minimum = check.value;
        } else if (check.kind === 'max') {
          schema.maximum = check.value;
        }
      }
      
      return schema;
    }

    if (zodSchema instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }

    if (zodSchema instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: zodSchema.options,
      };
    }

    if (zodSchema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodToJsonSchema(zodSchema.element),
      };
    }

    if (zodSchema instanceof z.ZodOptional) {
      return this.zodToJsonSchema(zodSchema.unwrap());
    }

    if (zodSchema instanceof z.ZodNullable) {
      const innerSchema = this.zodToJsonSchema(zodSchema.unwrap());
      return {
        ...innerSchema,
        nullable: true,
      };
    }

    // Default fallback
    return { type: 'object' };
  }

  /**
   * Process schema - handle both Zod schemas and plain objects
   */
  private processSchema(schema: any): any {
    if (!schema) {
      return undefined;
    }

    // If it's a Zod schema, convert it
    if (schema instanceof z.ZodType) {
      return this.zodToJsonSchema(schema);
    }

    // If it's already a JSON schema object, return as-is
    return schema;
  }
}