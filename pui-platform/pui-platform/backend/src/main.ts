import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const tlsCertPath = process.env['TLS_CERT_PATH'];
  const tlsKeyPath = process.env['TLS_KEY_PATH'];

  let httpsOptions: { key: Buffer; cert: Buffer; minVersion: 'TLSv1.2' } | undefined;
  if (tlsCertPath && tlsKeyPath && fs.existsSync(tlsCertPath) && fs.existsSync(tlsKeyPath)) {
    httpsOptions = {
      key: fs.readFileSync(tlsKeyPath),
      cert: fs.readFileSync(tlsCertPath),
      minVersion: 'TLSv1.2',
    };
  }

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.use(
    (helmet as unknown as typeof import('helmet').default)({
      hsts: { maxAge: 31536000, includeSubDomains: true },
      noSniff: true,
      frameguard: { action: 'deny' },
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
      referrerPolicy: { policy: 'no-referrer' },
      hidePoweredBy: true,
    }),
  );

  const puiOrigin = process.env['PUI_ORIGIN'] ?? '';
  const panelOrigin = process.env['PANEL_ORIGIN'] ?? '';

  app.enableCors({
    origin: [puiOrigin, panelOrigin].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`PUI Backend running on port ${port}`);
}

bootstrap();
