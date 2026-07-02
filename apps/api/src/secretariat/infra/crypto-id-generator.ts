import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IdGenerator } from '@frotas/domain';

@Injectable()
export class CryptoIdGenerator implements IdGenerator {
  newId(): string {
    return randomUUID();
  }
}
