import {
  All,
  Controller,
  Logger,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from '../webhooks/webhooks.service';
import { RequestsService } from '../requests/requests.service';
import { EventsGateway } from '../realtime/events.gateway';
import { HttpMethod } from '../webhooks/schemas/webhook.schema';

@Controller()
export class CaptureController {
  private readonly logger = new Logger('Capture');

  constructor(
    private readonly webhooks: WebhooksService,
    private readonly requests: RequestsService,
    private readonly events: EventsGateway,
  ) {}

  @All(':companySlug/:webhookPath')
  async handle(
    @Param('companySlug') companySlug: string,
    @Param('webhookPath') webhookPath: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const start = Date.now();
    const found = await this.webhooks.findBySlugAndPath(companySlug, webhookPath);

    if (!found) {
      return res.status(404).json({
        error: 'webhook_not_found',
        message: `No webhook at /${companySlug}/${webhookPath}`,
      });
    }

    const { webhook, company } = found;

    if (!webhook.enabled) {
      return res.status(503).json({
        error: 'webhook_disabled',
        message: 'This webhook is disabled',
      });
    }

    const method = req.method.toUpperCase() as HttpMethod;
    if (!webhook.allowedMethods.includes(method)) {
      res.setHeader('Allow', webhook.allowedMethods.join(', '));
      return res.status(405).json({
        error: 'method_not_allowed',
        allowed: webhook.allowedMethods,
      });
    }

    const rawBody: Buffer | undefined = (req as any).rawBody;
    const rawBodyStr = rawBody ? rawBody.toString('utf8') : '';
    const parsedBody = this.parseBody(req, rawBodyStr);

    const response = webhook.response ?? ({} as any);
    const statusCode = response.statusCode ?? 200;

    if (response.headers && typeof response.headers === 'object') {
      for (const [k, v] of Object.entries(response.headers)) {
        if (typeof v === 'string') res.setHeader(k, v);
      }
    }
    if (response.contentType) {
      res.setHeader('Content-Type', response.contentType);
    } else {
      res.setHeader('Content-Type', 'application/json');
    }

    const responseBody = response.body && response.body.length > 0
      ? response.body
      : JSON.stringify({ ok: true });

    res.status(statusCode).send(responseBody);

    const responseTimeMs = Date.now() - start;

    try {
      const created = await this.requests.create({
        webhookId: webhook._id as any,
        companyId: company._id as any,
        method,
        url: req.originalUrl,
        path: req.path,
        query: req.query as any,
        headers: req.headers as any,
        body: parsedBody,
        rawBody: this.truncate(rawBodyStr, 10 * 1024 * 1024),
        contentType: req.headers['content-type'] ?? '',
        contentLength: rawBody?.length ?? 0,
        ip: req.ip ?? '',
        ips: req.ips ?? [],
        userAgent: req.headers['user-agent'] ?? '',
        protocol: req.protocol,
        hostname: req.hostname,
        responseStatus: statusCode,
        responseTimeMs,
        receivedAt: new Date(start),
      });

      this.events.emitNewRequest({
        webhookId: String(webhook._id),
        companyId: String(company._id),
        request: created.toObject(),
      });
    } catch (err) {
      this.logger.error(
        `failed to persist request for ${companySlug}/${webhookPath}: ${(err as Error).message}`,
      );
    }
  }

  private parseBody(req: Request, raw: string): any {
    const ct = (req.headers['content-type'] ?? '').toLowerCase();
    if (!raw) return null;
    if (ct.includes('application/json')) {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    if (ct.includes('application/x-www-form-urlencoded')) {
      try {
        return Object.fromEntries(new URLSearchParams(raw).entries());
      } catch {
        return raw;
      }
    }
    if (ct.startsWith('text/')) return raw;
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return req.body;
    }
    return raw;
  }

  private truncate(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.slice(0, max) : s;
  }
}
