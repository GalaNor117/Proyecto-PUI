import { Module } from '@nestjs/common';
import { SistemaInternoStubRepository } from './stub/sistema-interno-stub.repository';
import { SISTEMA_INTERNO_REPOSITORY } from './sistema-interno.repository.interface';

@Module({
  providers: [
    { provide: SISTEMA_INTERNO_REPOSITORY, useClass: SistemaInternoStubRepository },
  ],
  exports: [SISTEMA_INTERNO_REPOSITORY],
})
export class SistemaInternoModule {}
