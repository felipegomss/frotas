import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { SecretariatModule } from './secretariat/secretariat.module';
import { DriverModule } from './driver/driver.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    VehicleModule,
    SecretariatModule,
    DriverModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Validates Zod-backed DTOs (nestjs-zod) at the request edge (fase 4).
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
