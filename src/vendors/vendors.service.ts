import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Lead, LeadDocument, LeadStatus } from '../schemas/lead.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async getAllVendors(query: any) {
    const {
      category,
      city,
      minPrice,
      maxPrice,
      rating,
      isPremium,
      isFeatured,
      search,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = query;

    const filter: any = { role: UserRole.VENDOR, isActive: true };

    if (category) filter.category = category;
    if (city) filter.businessCity = { $regex: city, $options: 'i' };
    if (minPrice) filter['priceRange.min'] = { $gte: minPrice };
    if (maxPrice) filter['priceRange.max'] = { $lte: maxPrice };
    if (rating) filter.rating = { $gte: rating };
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
        { businessCity: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const vendors = await this.userModel
      .find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await this.userModel.countDocuments(filter);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId: string) {
    const vendor = await this.userModel
      .findOne({ _id: vendorId, role: UserRole.VENDOR, isActive: true })
      .select('-password -emailVerificationToken -passwordResetToken');

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async getVendorLeads(vendorId: string, status?: LeadStatus) {
    const filter: any = { vendorId: new Types.ObjectId(vendorId) };
    if (status) filter.status = status;

    const leads = await this.leadModel
      .find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    return leads;
  }

  async updateLeadStatus(
    vendorId: string,
    leadId: string,
    status: LeadStatus,
    notes?: string,
  ) {
    const lead = await this.leadModel.findOne({
      _id: leadId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.status = status;
    if (notes) lead.notes = notes;
    lead.lastContactDate = new Date();

    await lead.save();
    return lead;
  }

  async contactLead(vendorId: string, leadId: string, message: string) {
    const lead = await this.leadModel.findOne({
      _id: leadId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.vendorResponse = message;
    lead.status = LeadStatus.CONTACTED;
    lead.lastContactDate = new Date();

    await lead.save();
    return lead;
  }

  async sendQuote(
    vendorId: string,
    leadId: string,
    quoteAmount: number,
    quoteDetails: string,
  ) {
    const lead = await this.leadModel.findOne({
      _id: leadId,
      vendorId: new Types.ObjectId(vendorId),
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.quoteAmount = quoteAmount;
    lead.quoteDetails = quoteDetails;
    lead.status = LeadStatus.QUOTED;
    lead.lastContactDate = new Date();

    await lead.save();
    return lead;
  }

  async getVendorReviews(vendorId: string) {
    const reviews = await this.reviewModel
      .find({ vendorId: new Types.ObjectId(vendorId) })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return reviews;
  }

  async updatePortfolio(vendorId: string, portfolio: string[]) {
    const vendor = await this.userModel.findById(vendorId);
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.portfolio = portfolio;
    await vendor.save();

    return vendor;
  }

  async updatePackages(vendorId: string, packages: any[]) {
    const vendor = await this.userModel.findById(vendorId);
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.packages = packages;
    await vendor.save();

    return vendor;
  }

  async getVendorAnalytics(vendorId: string) {
    const vendor = await this.userModel.findById(vendorId);
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found');
    }

    // Get leads analytics
    const leadsStats = await this.leadModel.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Get reviews analytics
    const reviewsStats = await this.reviewModel.aggregate([
      { $match: { vendorId: new Types.ObjectId(vendorId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return {
      leads: leadsStats,
      reviews: reviewsStats[0] || { averageRating: 0, totalReviews: 0 },
      profileViews: Math.floor(Math.random() * 1000) + 500, // Mock data
      clicks: Math.floor(Math.random() * 100) + 50,
      conversionRate: Math.floor(Math.random() * 20) + 10,
    };
  }
}
