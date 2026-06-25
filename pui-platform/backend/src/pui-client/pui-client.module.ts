import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PuiClientService } from './pui-client.service';
import { PuiAuthService } from './pui-auth.service';

@Module({
  imports: [HttpModule],
  providers: [PuiClientService, PuiAuthService],
  exports: [PuiClientService, PuiAuthService],
})
export class PuiClientModule {}
