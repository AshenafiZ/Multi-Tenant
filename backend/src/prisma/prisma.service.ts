import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client'; 

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
      max: 10,                 // adjust based on your needs & Supabase limits
      connectionTimeoutMillis: 2000,
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
    logger.log('🔄 Connecting to Supabase...');
    try {
      await this.$connect();
      this.logger.log('Prisma database connection established successfully');
      await this.$queryRaw`SELECT 1`;
      logger.log('✅ Database tables accessible');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database disconnected');
  }

}