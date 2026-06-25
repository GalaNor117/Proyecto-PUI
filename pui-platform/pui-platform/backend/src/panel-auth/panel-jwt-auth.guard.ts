import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PanelJwtAuthGuard extends AuthGuard('jwt-panel') {}
