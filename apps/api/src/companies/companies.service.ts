import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Webhook, WebhookDocument } from '../webhooks/schemas/webhook.schema';
import { RequestLog, RequestLogDocument } from '../requests/schemas/request.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Webhook.name) private readonly webhookModel: Model<WebhookDocument>,
    @InjectModel(RequestLog.name) private readonly requestModel: Model<RequestLogDocument>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyDocument> {
    const exists = await this.companyModel.exists({ slug: dto.slug });
    if (exists) {
      throw new ConflictException(`Company with slug "${dto.slug}" already exists`);
    }
    return this.companyModel.create(dto);
  }

  async findAll(): Promise<any[]> {
    const companies = await this.companyModel.find().sort({ createdAt: -1 }).lean();
    if (companies.length === 0) return [];

    const ids = companies.map((c) => c._id);
    const webhookCounts = await this.webhookModel.aggregate([
      { $match: { companyId: { $in: ids } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]);
    const requestCounts = await this.requestModel.aggregate([
      { $match: { companyId: { $in: ids } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]);

    const wMap = new Map(webhookCounts.map((x) => [String(x._id), x.count]));
    const rMap = new Map(requestCounts.map((x) => [String(x._id), x.count]));

    return companies.map((c) => ({
      ...c,
      webhookCount: wMap.get(String(c._id)) ?? 0,
      requestCount: rMap.get(String(c._id)) ?? 0,
    }));
  }

  async findOne(id: string): Promise<CompanyDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('Company not found');
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findBySlug(slug: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ slug });
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('Company not found');
    if (dto.slug) {
      const conflict = await this.companyModel.findOne({
        slug: dto.slug,
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (conflict) {
        throw new ConflictException(`Company with slug "${dto.slug}" already exists`);
      }
    }
    const updated = await this.companyModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Company not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(id)) throw new NotFoundException('Company not found');
    const company = await this.companyModel.findById(id);
    if (!company) throw new NotFoundException('Company not found');
    const objId = new Types.ObjectId(id);
    await this.requestModel.deleteMany({ companyId: objId });
    await this.webhookModel.deleteMany({ companyId: objId });
    await this.companyModel.findByIdAndDelete(id);
    return { deleted: true };
  }
}
