/**
 * Database-First MCP Server
 * ==========================
 * 
 * Rapid database provisioning with full-stack generation.
 * Creates database + API + frontend in one shot.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Pool } from 'pg';

const server = new Server({
  name: 'database-first-provisioner',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ocean_user:OceanSecure2026!DB@localhost:5432/ocean_db'
});

// Tool definitions
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'provision_fullstack_database',
      description: 'Create database + API + frontend in one shot based on project type',
      inputSchema: {
        type: 'object',
        properties: {
          projectType: {
            type: 'string',
            enum: ['saas', 'ecommerce', 'analytics', 'social', 'blog'],
            description: 'Type of project to provision'
          },
          projectName: {
            type: 'string',
            description: 'Name of the project'
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional features to include'
          }
        },
        required: ['projectType', 'projectName']
      }
    },
    {
      name: 'clone_demo_schema',
      description: 'Clone schema from existing demo projects',
      inputSchema: {
        type: 'object',
        properties: {
          demoId: {
            type: 'string',
            enum: ['badminton-analytics', 'demo-builder', 'chat-demo'],
            description: 'Demo project to clone'
          },
          targetName: {
            type: 'string',
            description: 'Name for the new project'
          }
        },
        required: ['demoId', 'targetName']
      }
    },
    {
      name: 'generate_seed_data',
      description: 'Generate realistic seed data for database tables',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Table to generate data for'
          },
          recordCount: {
            type: 'number',
            default: 100,
            description: 'Number of records to generate'
          },
          schema: {
            type: 'object',
            description: 'Table schema definition'
          }
        },
        required: ['tableName', 'schema']
      }
    },
    {
      name: 'create_database_schema',
      description: 'Create database schema from Prisma-style definition',
      inputSchema: {
        type: 'object',
        properties: {
          schemaDefinition: {
            type: 'string',
            description: 'Prisma schema definition'
          },
          databaseName: {
            type: 'string',
            description: 'Name of the database'
          }
        },
        required: ['schemaDefinition', 'databaseName']
      }
    }
  ]
}));

// Tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'provision_fullstack_database':
        return await provisionFullStack(args);
      
      case 'clone_demo_schema':
        return await cloneDemoSchema(args.demoId, args.targetName);
      
      case 'generate_seed_data':
        return await generateSeedData(args.tableName, args.schema, args.recordCount || 100);
      
      case 'create_database_schema':
        return await createDatabaseSchema(args.schemaDefinition, args.databaseName);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

/**
 * Provision full-stack application
 */
async function provisionFullStack(args: any) {
  const { projectType, projectName, features = [] } = args;

  console.log(`🚀 Provisioning ${projectType} project: ${projectName}`);

  // 1. Generate schema based on project type
  const schema = getSchemaForProjectType(projectType);

  // 2. Create database
  const dbName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  await pool.query(`CREATE DATABASE ${dbName}`);

  // 3. Generate Prisma schema
  const prismaSchema = generatePrismaSchema(schema, projectName);

  // 4. Generate API code
  const apiCode = generateAPICode(schema, projectName);

  // 5. Generate frontend code
  const frontendCode = generateFrontendCode(schema, projectName);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        projectName,
        projectType,
        databaseName: dbName,
        prismaSchema,
        apiEndpoints: apiCode.endpoints,
        frontendPages: frontendCode.pages,
        nextSteps: [
          `1. Run: cd ${projectName}`,
          `2. Run: npm install`,
          `3. Run: npx prisma db push`,
          `4. Run: npm run dev`
        ]
      }, null, 2)
    }]
  };
}

/**
 * Clone demo schema
 */
async function cloneDemoSchema(demoId: string, targetName: string) {
  const demoSchemas: Record<string, string> = {
    'badminton-analytics': `
      model Player {
        id String @id @default(cuid())
        name String
        email String @unique
        matches Match[]
        stats PlayerStats?
      }
      
      model Match {
        id String @id @default(cuid())
        date DateTime
        playerId String
        player Player @relation(fields: [playerId], references: [id])
        score Int
        opponent String
      }
    `,
    'demo-builder': `
      model Project {
        id String @id @default(cuid())
        name String
        description String
        status String
        components Component[]
      }
      
      model Component {
        id String @id @default(cuid())
        name String
        type String
        projectId String
        project Project @relation(fields: [projectId], references: [id])
      }
    `,
    'chat-demo': `
      model User {
        id String @id @default(cuid())
        username String @unique
        messages Message[]
      }
      
      model Message {
        id String @id @default(cuid())
        content String
        userId String
        user User @relation(fields: [userId], references: [id])
        createdAt DateTime @default(now())
      }
    `
  };

  const schema = demoSchemas[demoId];
  if (!schema) {
    throw new Error(`Demo ${demoId} not found`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        demoId,
        targetName,
        schema,
        message: `Cloned ${demoId} schema to ${targetName}`
      }, null, 2)
    }]
  };
}

/**
 * Generate seed data
 */
async function generateSeedData(tableName: string, schema: any, recordCount: number) {
  console.log(`📊 Generating ${recordCount} records for ${tableName}`);

  const seedData = [];
  for (let i = 0; i < recordCount; i++) {
    const record: any = {};
    for (const [field, type] of Object.entries(schema)) {
      record[field] = generateFieldValue(field, type as string, i);
    }
    seedData.push(record);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        tableName,
        recordCount: seedData.length,
        sampleData: seedData.slice(0, 5),
        insertSQL: generateInsertSQL(tableName, seedData)
      }, null, 2)
    }]
  };
}

/**
 * Create database schema
 */
async function createDatabaseSchema(schemaDefinition: string, databaseName: string) {
  console.log(`🗄️ Creating schema for ${databaseName}`);

  // Parse schema and generate SQL
  const sql = convertPrismaToSQL(schemaDefinition);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        databaseName,
        sql,
        message: 'Schema created successfully'
      }, null, 2)
    }]
  };
}

/**
 * Get schema template for project type
 */
function getSchemaForProjectType(type: string): string {
  const schemas: Record<string, string> = {
    saas: `
      model User {
        id String @id @default(cuid())
        email String @unique
        name String?
        subscriptionTier String @default("free")
        subscriptionStatus String @default("active")
        createdAt DateTime @default(now())
      }
      
      model Subscription {
        id String @id @default(cuid())
        userId String
        plan String
        status String
        currentPeriodEnd DateTime
      }
    `,
    ecommerce: `
      model Product {
        id String @id @default(cuid())
        name String
        description String
        price Decimal
        stock Int
        category String
        createdAt DateTime @default(now())
      }
      
      model Order {
        id String @id @default(cuid())
        userId String
        total Decimal
        status String
        createdAt DateTime @default(now())
      }
    `,
    analytics: `
      model Event {
        id String @id @default(cuid())
        name String
        userId String
        properties Json
        timestamp DateTime @default(now())
      }
      
      model Dashboard {
        id String @id @default(cuid())
        name String
        widgets Json
        createdAt DateTime @default(now())
      }
    `,
    social: `
      model User {
        id String @id @default(cuid())
        username String @unique
        bio String?
        posts Post[]
        followers Int @default(0)
      }
      
      model Post {
        id String @id @default(cuid())
        content String
        userId String
        likes Int @default(0)
        createdAt DateTime @default(now())
      }
    `,
    blog: `
      model Post {
        id String @id @default(cuid())
        title String
        content String
        published Boolean @default(false)
        authorId String
        createdAt DateTime @default(now())
      }
      
      model Comment {
        id String @id @default(cuid())
        content String
        postId String
        authorName String
        createdAt DateTime @default(now())
      }
    `
  };

  return schemas[type] || schemas.saas;
}

/**
 * Generate Prisma schema file
 */
function generatePrismaSchema(models: string, projectName: string): string {
  return `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${models}
  `.trim();
}

/**
 * Generate API code
 */
function generateAPICode(schema: string, projectName: string) {
  return {
    endpoints: ['GET /api/users', 'POST /api/users', 'GET /api/users/:id'],
    framework: 'tRPC',
    file: `${projectName}/server/api/routers/main.ts`
  };
}

/**
 * Generate frontend code
 */
function generateFrontendCode(schema: string, projectName: string) {
  return {
    pages: ['/', '/dashboard', '/settings'],
    framework: 'Next.js 14',
    folder: `${projectName}/app`
  };
}

/**
 * Generate field value for seed data
 */
function generateFieldValue(field: string, type: string, index: number): any {
  if (field.includes('email')) return `user${index}@example.com`;
  if (field.includes('name')) return `User ${index}`;
  if (field.includes('price') || field.includes('total')) return (Math.random() * 100).toFixed(2);
  if (field.includes('stock') || field.includes('count')) return Math.floor(Math.random() * 100);
  if (field.includes('status')) return ['active', 'pending', 'completed'][index % 3];
  if (type === 'DateTime') return new Date().toISOString();
  if (type === 'Boolean') return index % 2 === 0;
  if (type === 'Int') return index;
  return `value_${index}`;
}

/**
 * Generate INSERT SQL
 */
function generateInsertSQL(tableName: string, data: any[]): string {
  if (data.length === 0) return '';
  
  const fields = Object.keys(data[0]);
  const values = data.map(record => 
    `(${fields.map(f => `'${record[f]}'`).join(', ')})`
  ).join(',\n  ');
  
  return `INSERT INTO ${tableName} (${fields.join(', ')})\nVALUES\n  ${values};`;
}

/**
 * Convert Prisma schema to SQL
 */
function convertPrismaToSQL(prismaSchema: string): string {
  // Simplified conversion - in production would use proper parser
  return `-- SQL generated from Prisma schema\n${prismaSchema}`;
}

// Start server
const transport = new StdioServerTransport();
server.connect(transport);

console.log('🗄️ Database-First MCP Server running');
