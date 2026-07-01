import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /health/db — liveness of the control-plane database.
  @Get('db')
  async db(): Promise<{ ok: boolean; tenants?: number }> {
    try {
      const tenants = await this.prisma.client.tenant.count();
      return { ok: true, tenants };
    } catch {
      return { ok: false };
    }
  }
}
