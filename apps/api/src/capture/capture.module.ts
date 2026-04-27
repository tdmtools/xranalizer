import { Module } from '@nestjs/common';
import { CaptureController } from './capture.controller';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [WebhooksModule, RequestsModule],
  controllers: [CaptureController],
})
export class CaptureModule {}
