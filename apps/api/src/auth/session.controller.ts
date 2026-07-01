import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { PrefecturesResponse, SessionResponse } from '@frotas/contracts';
import { AuthService } from './auth.service';
import { IdpGuard } from './idp.guard';
import { StartSessionDto } from './start-session.dto';
import type { AuthedRequest } from './session-principal';

// Route in Portuguese (frontier); authenticated by the IdP token (IdpGuard).
@Controller('sessao')
@UseGuards(IdpGuard)
export class SessionController {
  constructor(private readonly auth: AuthService) {}

  // GET /sessao/prefeituras — prefectures the identity may act in.
  @Get('prefeituras')
  listPrefectures(@Req() req: AuthedRequest): Promise<PrefecturesResponse> {
    return this.auth.listPrefectures(this.sub(req));
  }

  // POST /sessao — validates the membership and mints the session token.
  @Post()
  @HttpCode(200)
  sessao(
    @Req() req: AuthedRequest,
    @Body() body: StartSessionDto,
  ): Promise<SessionResponse> {
    return this.auth.startSession(this.sub(req), body.tenantId);
  }

  private sub(req: AuthedRequest): string {
    if (!req.identity) {
      throw new UnauthorizedException('Identidade não autenticada.');
    }
    return req.identity.sub;
  }
}
