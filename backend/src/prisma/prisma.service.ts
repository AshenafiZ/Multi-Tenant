import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const logger = new Logger('PrismaService');

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment');
    }
    
    logger.log('DATABASE_URL found, initializing connection pool');
    
    const pool = new Pool({
      connectionString,
      max: 10, // Maximum number of clients in the pool
      min: 2,  // Minimum number of clients in the pool
      connectionTimeoutMillis: 10000, // Increased to 10 seconds
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      statement_timeout: 30000, // Query timeout: 30 seconds
      query_timeout: 30000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    const adapter = new PrismaPg(pool);
    logger.log('PrismaPg adapter initialized with connection pool');
    
    super({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    this.logger.log('🔄 Connecting to database...');
    
    try {
      // Connect with timeout
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        ),
      ]);
      
      this.logger.log('✅ Prisma database connection established successfully');
      
      // Health check with timeout
      try {
        await Promise.race([
          this.$queryRaw`SELECT 1 as health_check`,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        this.logger.log('✅ Database health check passed');
      } catch (healthError) {
        this.logger.warn('⚠️ Database health check failed, but connection is established', healthError);
        // Don't throw - connection might still work
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      this.logger.error('Please check:');
      this.logger.error('1. DATABASE_URL is correct in .env file');
      this.logger.error('2. Database server is running');
      this.logger.error('3. Network connectivity to database');
      this.logger.error('4. Database credentials are correct');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database disconnected');
  }

}