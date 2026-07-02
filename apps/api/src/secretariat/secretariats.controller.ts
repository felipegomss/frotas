import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  CreateSecretariat,
  DeleteSecretariat,
  GetSecretariat,
  ListSecretariats,
  UpdateSecretariat,
} from '@frotas/domain';
import type {
  SecretariatListResponse,
  SecretariatResponse,
} from '@frotas/contracts';
import { SessionGuard } from '../auth/session.guard';
import { CreateSecretariatDto, UpdateSecretariatDto } from './secretariat.dto';

// Route in Portuguese (frontier: /secretarias), class in English (interior).
@Controller('secretarias')
@UseGuards(SessionGuard)
export class SecretariatsController {
  constructor(
    private readonly createSecretariat: CreateSecretariat,
    private readonly listSecretariats: ListSecretariats,
    private readonly getSecretariat: GetSecretariat,
    private readonly updateSecretariat: UpdateSecretariat,
    private readonly deleteSecretariat: DeleteSecretariat,
  ) {}

  @Post()
  async create(
    @Body() body: CreateSecretariatDto,
  ): Promise<SecretariatResponse> {
    const secretariat = await this.createSecretariat.execute(body.name);
    return { id: secretariat.id, name: secretariat.name };
  }

  @Get()
  async list(): Promise<SecretariatListResponse> {
    const secretariats = await this.listSecretariats.execute();
    return secretariats.map((s) => ({ id: s.id, name: s.name }));
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<SecretariatResponse> {
    const secretariat = await this.getSecretariat.execute(id);
    return { id: secretariat.id, name: secretariat.name };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSecretariatDto,
  ): Promise<SecretariatResponse> {
    const secretariat = await this.updateSecretariat.execute(id, body.name);
    return { id: secretariat.id, name: secretariat.name };
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSecretariat.execute(id);
  }
}
