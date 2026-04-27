import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded, raw, text } from 'express';
import type { Request } from 'express';
import { AppModule } from './app.module';

function rawBodySaver(req: Request, _res: any, buf: Buffer) {
  if (buf?.length) {
    (req as any).rawBody = buf;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('api.port') ?? 3001;
  const host = config.get<string>('api.host') ?? '0.0.0.0';
  const corsOrigin = config.get<string>('api.corsOrigin') ?? '*';
  const maxBody = config.get<string>('api.maxBodySize') ?? '10mb';

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.use(json({ limit: maxBody, verify: rawBodySaver }));
  app.use(urlencoded({ extended: true, limit: maxBody, verify: rawBodySaver }));
  app.use(text({ limit: maxBody, type: 'text/*', verify: rawBodySaver }));
  app.use(raw({ limit: maxBody, type: () => true, verify: rawBodySaver }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`[XRAnalizer API] listening on http://${host}:${port}`);
}

bootstrap();
