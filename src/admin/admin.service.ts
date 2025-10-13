import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Vendor, VendorDocument, VendorStatus } from '../schemas/vendor.schema';
import { Idea, IdeaDocument } from '../schemas/idea.schema';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Inquiry, InquiryDocument } from '../schemas/inquiry.schema';
import {
  AdminStatsQueryDto,
  UserQueryDto,
  VendorQueryDto,
  ContentQueryDto,
  UpdateUserStatusDto,
  UpdateVendorStatusDto,
  UpdateContentStatusDto,
  FeaturedListingDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Inquiry.name) private inquiryModel: Model<InquiryDocument>,
  ) {}

  async getDashboardStats(queryDto: AdminStatsQueryDto): Promise<any> {
    const { startDate, endDate, period } = queryDto;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period) {
      const now = new Date();
      let periodStart: Date;

      switch (period) {
        case 'day':
          periodStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      dateFilter.createdAt = { $gte: periodStart };
    }

    const [
      totalUsers,
      totalVendors,
      totalIdeas,
      totalBookings,
      totalReviews,
      totalInquiries,
      pendingVendors,
      publishedIdeas,
      completedBookings,
      verifiedReviews,
    ] = await Promise.all([
      this.userModel.countDocuments({ ...dateFilter, isActive: true }).exec(),
      this.vendorModel.countDocuments({ ...dateFilter, isActive: true }).exec(),
      this.ideaModel.countDocuments({ ...dateFilter, isActive: true }).exec(),
      this.bookingModel
        .countDocuments({ ...dateFilter, isActive: true })
        .exec(),
      this.reviewModel.countDocuments({ ...dateFilter, isActive: true }).exec(),
      this.inquiryModel
        .countDocuments({ ...dateFilter, isActive: true })
        .exec(),
      this.vendorModel
        .countDocuments({
          ...dateFilter,
          status: VendorStatus.PENDING,
          isActive: true,
        })
        .exec(),
      this.ideaModel
        .countDocuments({ ...dateFilter, isPublished: true, isActive: true })
        .exec(),
      this.bookingModel
        .countDocuments({ ...dateFilter, status: 'completed', isActive: true })
        .exec(),
      this.reviewModel
        .countDocuments({ ...dateFilter, isVerified: true, isActive: true })
        .exec(),
    ]);

    // Calculate revenue (if bookings have payment information)
    const revenueData = await this.bookingModel.aggregate([
      { $match: { ...dateFilter, isActive: true, paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return {
      overview: {
        totalUsers,
        totalVendors,
        totalIdeas,
        totalBookings,
        totalReviews,
        totalInquiries,
        totalRevenue,
      },
      pending: {
        pendingVendors,
        unpublishedIdeas: totalIdeas - publishedIdeas,
        pendingBookings: totalBookings - completedBookings,
        unverifiedReviews: totalReviews - verifiedReviews,
      },
      completion: {
        publishedIdeas,
        completedBookings,
        verifiedReviews,
      },
    };
  }

  async getUsers(queryDto: UserQueryDto): Promise<{
    users: UserDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async getVendors(queryDto: VendorQueryDto): Promise<{
    vendors: VendorDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      isVerified,
      isFeatured,
      district,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    if (district) {
      filter.district = district;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      this.vendorModel
        .find(filter)
        .populate('userId', 'firstName lastName email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.vendorModel.countDocuments(filter).exec(),
    ]);

    return {
      vendors,
      total,
      page,
      limit,
    };
  }

  async getContent(queryDto: ContentQueryDto): Promise<{
    content: IdeaDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      type,
      category,
      isPublished,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (isPublished !== undefined) {
      filter.isPublished = isPublished;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      this.ideaModel
        .find(filter)
        .populate('authorId', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ideaModel.countDocuments(filter).exec(),
    ]);

    return {
      content,
      total,
      page,
      limit,
    };
  }

  async updateUserStatus(
    userId: string,
    updateUserStatusDto: UpdateUserStatusDto,
    adminId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = updateUserStatusDto.isActive;
    await user.save();

    return user;
  }

  async updateVendorStatus(
    vendorId: string,
    updateVendorStatusDto: UpdateVendorStatusDto,
    adminId: string,
  ): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.status = updateVendorStatusDto.status;
    vendor.approvedBy = new Types.ObjectId(adminId);

    if (updateVendorStatusDto.status === VendorStatus.APPROVED) {
      vendor.approvedAt = new Date();
      vendor.rejectionReason = undefined;
    } else if (updateVendorStatusDto.status === VendorStatus.REJECTED) {
      vendor.rejectionReason = updateVendorStatusDto.rejectionReason;
    }

    if (updateVendorStatusDto.isVerified !== undefined) {
      vendor.isVerified = updateVendorStatusDto.isVerified;
    }

    if (updateVendorStatusDto.isFeatured !== undefined) {
      vendor.isFeatured = updateVendorStatusDto.isFeatured;
      if (updateVendorStatusDto.isFeatured) {
        vendor.featuredAt = new Date();
      }
    }

    return vendor.save();
  }

  async updateContentStatus(
    contentId: string,
    updateContentStatusDto: UpdateContentStatusDto,
    adminId: string,
  ): Promise<IdeaDocument> {
    const content = await this.ideaModel.findById(contentId).exec();
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    content.isPublished = updateContentStatusDto.isPublished;

    if (updateContentStatusDto.isPublished && !content.publishedAt) {
      content.publishedAt = new Date();
    }

    if (updateContentStatusDto.isFeatured !== undefined) {
      content.isFeatured = updateContentStatusDto.isFeatured;
      if (updateContentStatusDto.isFeatured) {
        content.featuredAt = new Date();
      }
    }

    return content.save();
  }

  async updateFeaturedListing(
    featuredListingDto: FeaturedListingDto,
    adminId: string,
  ): Promise<{ message: string }> {
    const { itemId, itemType, isFeatured, reason } = featuredListingDto;

    if (itemType === 'vendor') {
      const vendor = await this.vendorModel.findById(itemId).exec();
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      vendor.isFeatured = isFeatured;
      if (isFeatured) {
        vendor.featuredAt = new Date();
      }
      await vendor.save();
    } else if (itemType === 'idea') {
      const idea = await this.ideaModel.findById(itemId).exec();
      if (!idea) {
        throw new NotFoundException('Idea not found');
      }

      idea.isFeatured = isFeatured;
      if (isFeatured) {
        idea.featuredAt = new Date();
      }
      await idea.save();
    }

    return { message: `Featured status updated for ${itemType}` };
  }

  async getRecentActivity(limit: number = 20): Promise<any[]> {
    const [recentUsers, recentVendors, recentIdeas, recentBookings] =
      await Promise.all([
        this.userModel
          .find({ isActive: true })
          .select('firstName lastName email role createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
        this.vendorModel
          .find({ isActive: true })
          .populate('userId', 'firstName lastName email')
          .select('businessName status createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
        this.ideaModel
          .find({ isActive: true })
          .populate('authorId', 'firstName lastName')
          .select('title type category createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
        this.bookingModel
          .find({ isActive: true })
          .populate('customerId', 'firstName lastName')
          .populate('vendorId', 'businessName')
          .select('serviceName status totalAmount createdAt')
          .sort({ createdAt: -1 })
          .limit(5)
          .exec(),
      ]);

    return [
      ...recentUsers.map((user) => ({ type: 'user', data: user })),
      ...recentVendors.map((vendor) => ({ type: 'vendor', data: vendor })),
      ...recentIdeas.map((idea) => ({ type: 'idea', data: idea })),
      ...recentBookings.map((booking) => ({ type: 'booking', data: booking })),
    ]
      .sort(
        (a, b) =>
          new Date(b.data.createdAt).getTime() -
          new Date(a.data.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  async getAnalytics(queryDto: AdminStatsQueryDto): Promise<any> {
    const { startDate, endDate, period } = queryDto;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (period) {
      const now = new Date();
      let periodStart: Date;

      switch (period) {
        case 'day':
          periodStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      dateFilter.createdAt = { $gte: periodStart };
    }

    // User registration trends
    const userTrends = await this.userModel.aggregate([
      { $match: { ...dateFilter, isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Vendor registration trends
    const vendorTrends = await this.vendorModel.aggregate([
      { $match: { ...dateFilter, isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Revenue trends
    const revenueTrends = await this.bookingModel.aggregate([
      { $match: { ...dateFilter, isActive: true, paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Top performing vendors
    const topVendors = await this.vendorModel.aggregate([
      { $match: { isActive: true, status: VendorStatus.APPROVED } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'vendorId',
          as: 'bookings',
        },
      },
      {
        $addFields: {
          totalRevenue: { $sum: '$bookings.totalAmount' },
          totalBookings: { $size: '$bookings' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          businessName: 1,
          rating: 1,
          reviewCount: 1,
          totalRevenue: 1,
          totalBookings: 1,
        },
      },
    ]);

    // Category distribution
    const categoryDistribution = await this.vendorModel.aggregate([
      { $match: { isActive: true, status: VendorStatus.APPROVED } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      trends: {
        users: userTrends,
        vendors: vendorTrends,
        revenue: revenueTrends,
      },
      topVendors,
      categoryDistribution,
    };
  }
}
