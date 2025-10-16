import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Vendor,
  VendorDocument,
  VendorStatus,
  VendorCategory,
} from '../schemas/vendor.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import { Inquiry, InquiryDocument } from '../schemas/inquiry.schema';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorQueryDto,
  VendorApprovalDto,
} from './dto/vendor.dto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Inquiry.name) private inquiryModel: Model<InquiryDocument>,
    private emailService: EmailService,
  ) {}

  async create(
    createVendorDto: CreateVendorDto,
    userId: string,
  ): Promise<VendorDocument> {
    // Check if user already has a vendor profile
    const existingVendor = await this.vendorModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (existingVendor) {
      throw new BadRequestException('User already has a vendor profile');
    }

    // Check if user exists and has vendor role
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('User does not have vendor role');
    }

    const vendor = new this.vendorModel({
      ...createVendorDto,
      userId: new Types.ObjectId(userId),
      status: VendorStatus.PENDING,
    });

    const savedVendor = await vendor.save();

    // Send notification email to admin about new vendor application
    try {
      await this.emailService.sendNewVendorNotificationEmail(
        'admin@dreamweddings.lk', // This should come from config
        savedVendor.businessName,
        user.email,
      );
    } catch (error) {
      console.error('Failed to send new vendor notification email:', error);
    }

    return savedVendor;
  }

  async findAll(queryDto: VendorQueryDto): Promise<{
    vendors: VendorDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      categories,
      district,
      city,
      minPrice,
      maxPrice,
      minRating,
      isVerified,
      isFeatured,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true };

    // Only show approved vendors for public queries
    if (!status) {
      filter.status = VendorStatus.APPROVED;
    } else {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessDescription: { $regex: search, $options: 'i' } },
        { specializations: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (categories && categories.length > 0) {
      filter.categories = { $in: categories };
    }

    if (district) {
      filter.district = district;
    }

    if (city) {
      filter.city = city;
    }

    if (minPrice || maxPrice) {
      filter['priceRange.min'] = {};
      if (minPrice) filter['priceRange.min'].$gte = minPrice;
      if (maxPrice) filter['priceRange.max'] = {};
      if (maxPrice) filter['priceRange.max'].$lte = maxPrice;
    }

    if (minRating) {
      filter.rating = { $gte: minRating };
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
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

  async findOne(id: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone')
      .exec();

    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    // Increment view count
    vendor.viewCount += 1;
    await vendor.save();

    return vendor;
  }

  async findByUserId(userId: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'firstName lastName email phone')
      .exec();

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async update(
    id: string,
    updateVendorDto: UpdateVendorDto,
    userId: string,
  ): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findById(id).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if user owns this vendor profile or is admin
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (vendor.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only update your own vendor profile',
      );
    }

    // Keep the approved status when vendor updates their profile
    if (vendor.status === VendorStatus.APPROVED) {
      Object.assign(vendor, updateVendorDto);
    } else {
      Object.assign(vendor, updateVendorDto);
    }

    return vendor.save();
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const vendor = await this.vendorModel.findById(id).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if user owns this vendor profile or is admin
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (vendor.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only delete your own vendor profile',
      );
    }

    vendor.isActive = false;
    await vendor.save();

    return { message: 'Vendor profile deleted successfully' };
  }

  async approveVendor(
    id: string,
    approvalDto: VendorApprovalDto,
    adminId: string,
  ): Promise<VendorDocument> {
    const vendor = await this.vendorModel
      .findById(id)
      .populate('userId', 'email firstName lastName')
      .exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Note: This method is now called by SuperAdmin, so no need to check admin role

    const previousStatus = vendor.status;
    vendor.status = approvalDto.status;
    vendor.approvedBy = new Types.ObjectId(adminId);

    if (approvalDto.status === VendorStatus.APPROVED) {
      vendor.approvedAt = new Date();
      vendor.rejectionReason = undefined;
    } else if (approvalDto.status === VendorStatus.REJECTED) {
      vendor.rejectionReason = approvalDto.rejectionReason;
    }

    const savedVendor = await vendor.save();

    // Send email notification to vendor about status change
    if (previousStatus !== approvalDto.status) {
      try {
        const user = vendor.userId as any; // Already populated
        await this.emailService.sendVendorApprovalEmail(
          user.email,
          vendor.businessName,
          approvalDto.status,
          approvalDto.rejectionReason,
        );
      } catch (error) {
        console.error('Failed to send vendor approval email:', error);
      }
    }

    return savedVendor;
  }

  async updateRating(vendorId: string, newRating: number): Promise<void> {
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Calculate new average rating
    const totalRating = vendor.rating * vendor.reviewCount + newRating;
    vendor.reviewCount += 1;
    vendor.rating = totalRating / vendor.reviewCount;

    await vendor.save();
  }

  async getFeaturedVendors(limit: number = 10): Promise<VendorDocument[]> {
    return this.vendorModel
      .find({
        isActive: true,
        status: VendorStatus.APPROVED,
        isFeatured: true,
      })
      .populate('userId', 'firstName lastName email phone')
      .sort({ featuredAt: -1, rating: -1 })
      .limit(limit)
      .exec();
  }

  async getVendorsByCategory(
    category: VendorCategory,
    limit: number = 10,
  ): Promise<VendorDocument[]> {
    return this.vendorModel
      .find({
        isActive: true,
        status: VendorStatus.APPROVED,
        categories: category,
      })
      .populate('userId', 'firstName lastName email phone')
      .sort({ rating: -1, viewCount: -1 })
      .limit(limit)
      .exec();
  }

  async getVendorsByDistrict(
    district: string,
    limit: number = 10,
  ): Promise<VendorDocument[]> {
    return this.vendorModel
      .find({
        isActive: true,
        status: VendorStatus.APPROVED,
        district: district,
      })
      .populate('userId', 'firstName lastName email phone')
      .sort({ rating: -1, viewCount: -1 })
      .limit(limit)
      .exec();
  }

  async getPendingVendors(): Promise<VendorDocument[]> {
    return this.vendorModel
      .find({
        isActive: true,
        status: VendorStatus.PENDING,
      })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAnalytics(userId: string, period: string = '30d'): Promise<any> {
    const vendor = await this.findByUserId(userId);
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get booking statistics
    const totalBookings = await this.bookingModel.countDocuments({
      vendorId: vendor._id,
      isActive: true,
    }).exec();

    const bookingsThisMonth = await this.bookingModel.countDocuments({
      vendorId: vendor._id,
      isActive: true,
      createdAt: { $gte: startDate },
    }).exec();

    const bookingsLastMonth = await this.bookingModel.countDocuments({
      vendorId: vendor._id,
      isActive: true,
      createdAt: {
        $gte: new Date(startDate.getTime() - (now.getTime() - startDate.getTime())),
        $lt: startDate,
      },
    }).exec();

    // Get inquiry statistics
    const pendingInquiries = await this.inquiryModel.countDocuments({
      vendorId: vendor._id,
      status: 'pending',
    }).exec();

    // Get revenue
    const revenueData = await this.bookingModel.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          isActive: true,
          paymentStatus: 'paid',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]).exec();

    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return {
      totalBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      pendingInquiries,
      averageRating: vendor.rating,
      profileViews: vendor.viewCount,
      revenue,
    };
  }

  async incrementInquiryCount(vendorId: string): Promise<void> {
    await this.vendorModel
      .findByIdAndUpdate(vendorId, { $inc: { inquiryCount: 1 } })
      .exec();
  }

  async incrementBookingCount(vendorId: string): Promise<void> {
    await this.vendorModel
      .findByIdAndUpdate(vendorId, { $inc: { bookingCount: 1 } })
      .exec();
  }
}
