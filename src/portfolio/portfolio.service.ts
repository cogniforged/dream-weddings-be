import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Portfolio, PortfolioDocument } from '../schemas/portfolio.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioQueryDto } from './dto/portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto, userId: string): Promise<PortfolioDocument> {
    // Find the vendor profile for this user
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const portfolio = new this.portfolioModel({
      ...createPortfolioDto,
      vendorId: vendor._id,
    });

    return portfolio.save();
  }

  async findAll(queryDto: PortfolioQueryDto, userId?: string): Promise<{
    portfolios: PortfolioDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      category,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isFeatured,
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true };

    // If userId is provided, only show portfolios for that vendor
    if (userId) {
      const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
      if (!vendor) {
        throw new NotFoundException('Vendor profile not found');
      }
      filter.vendorId = vendor._id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [portfolios, total] = await Promise.all([
      this.portfolioModel
        .find(filter)
        .populate('vendorId', 'businessName businessLogo categories')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.portfolioModel.countDocuments(filter).exec(),
    ]);

    return {
      portfolios,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PortfolioDocument> {
    const portfolio = await this.portfolioModel
      .findById(id)
      .populate('vendorId', 'businessName businessLogo categories')
      .exec();

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Increment view count
    portfolio.viewCount += 1;
    await portfolio.save();

    return portfolio;
  }

  async update(id: string, updatePortfolioDto: UpdatePortfolioDto, userId: string): Promise<PortfolioDocument> {
    const portfolio = await this.portfolioModel.findById(id).exec();
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Check if user owns this portfolio
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (portfolio.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenException('You can only update your own portfolio');
    }

    Object.assign(portfolio, updatePortfolioDto);
    return portfolio.save();
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const portfolio = await this.portfolioModel.findById(id).exec();
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Check if user owns this portfolio
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (portfolio.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenException('You can only delete your own portfolio');
    }

    portfolio.isActive = false;
    await portfolio.save();

    return { message: 'Portfolio deleted successfully' };
  }

  async like(id: string, userId: string): Promise<PortfolioDocument> {
    const portfolio = await this.portfolioModel.findById(id).exec();
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // In a real implementation, you would track likes per user
    // For now, just increment the like count
    portfolio.likeCount += 1;
    return portfolio.save();
  }

  async getVendorPortfolio(vendorId: string): Promise<PortfolioDocument[]> {
    return this.portfolioModel
      .find({ vendorId: new Types.ObjectId(vendorId), isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }
}
