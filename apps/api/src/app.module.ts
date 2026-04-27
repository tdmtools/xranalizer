import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RouterModule } from '@nestjs/core';
import configuration from './config/configuration';
import { CompaniesModule } from './companies/companies.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RequestsModule } from './requests/requests.module';
import { CaptureModule } from './capture/capture.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
        dbName: config.get<string>('mongo.dbName'),
      }),
    }),
    RealtimeModule,
    CompaniesModule,
    WebhooksModule,
    RequestsModule,
    RouterModule.register([
      { path: 'api', module: CompaniesModule },
      { path: 'api', module: WebhooksModule },
      { path: 'api', module: RequestsModule },
    ]),
    CaptureModule,
  ],
})
export class AppModule {}
