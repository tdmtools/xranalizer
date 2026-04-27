import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from './schemas/webhook.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { RequestLog, RequestLogSchema } from '../requests/schemas/request.schema';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Webhook.name, schema: WebhookSchema },
      { name: Company.name, schema: CompanySchema },
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService, MongooseModule],
})
export class WebhooksModule {}
