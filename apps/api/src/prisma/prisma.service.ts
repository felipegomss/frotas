import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaClient, type PrismaClient } from '@frotas/db';

/**
 * Owns the control-plane PrismaClient lifecycle for the API.
 * The driver-adapter wiring lives in @frotas/db (createPrismaClient); this
 * service only manages connect/disconnect and exposes the client.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient = createPrismaClient();

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
