import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { VehicleModule } from './vehicle/vehicle.module';

@Module({
  imports: [HealthModule, VehicleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
