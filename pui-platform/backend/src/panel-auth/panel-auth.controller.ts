import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength } from 'class-validator';
import { PanelAuthService } from './panel-auth.service';

class LoginPanelDto {
  @IsString() username: string;
  @IsString() @MinLength(1) password: string;
}

@Controller('panel')
export class PanelAuthController {
  constructor(private readonly panelAuthService: PanelAuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginPanelDto) {
    return this.panelAuthService.login(dto.username, dto.password);
  }
}
