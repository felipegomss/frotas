import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('db')
  async db() {
    const tenants = await this.prisma.tenant.count();
    return { ok: true, tenants };
  }
}
