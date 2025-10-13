import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
  PaymentStatus,
} from '../schemas/booking.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  BookingReviewDto,
} from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    userId: string,
  ): Promise<BookingDocument> {
    const { vendorId, ...bookingData } = createBookingDto;

    // Check if vendor exists
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    const booking = new this.bookingModel({
      ...bookingData,
      customerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorId),
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      remainingAmount: bookingData.totalAmount,
    });

    const savedBooking = await booking.save();

    // Increment vendor booking count
    await this.vendorModel
      .findByIdAndUpdate(vendorId, { $inc: { bookingCount: 1 } })
      .exec();

    return savedBooking.populate(
      'customerId',
      'firstName lastName email phone',
    );
  }

  async findAll(
    queryDto: BookingQueryDto,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    bookings: BookingDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      paymentStatus,
      serviceCategory,
      startDate,
      endDate,
      sortBy = 'bookingDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    let filter: any = { isActive: true };

    // Filter based on user role
    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
    } else if (userRole === UserRole.VENDOR) {
      // Find vendor by userId
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        throw new NotFoundException('Vendor profile not found');
      }
      filter.vendorId = vendor._id;
    }
    // Admin can see all bookings

    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { specialRequirements: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (serviceCategory) {
      filter.serviceCategory = serviceCategory;
    }

    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) filter.bookingDate.$gte = new Date(startDate);
      if (endDate) filter.bookingDate.$lte = new Date(endDate);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('customerId', 'firstName lastName email phone')
        .populate('vendorId', 'businessName businessLogo')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vendorId', 'businessName businessLogo')
      .exec();

    if (!booking || !booking.isActive) {
      throw new NotFoundException('Booking not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      booking.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only view your own bookings');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || booking.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only view bookings for your business',
        );
      }
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId: string,
    userRole: UserRole,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking || !booking.isActive) {
      throw new NotFoundException('Booking not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      booking.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only update your own bookings');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || booking.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only update bookings for your business',
        );
      }
    }

    // Update remaining amount when payment is made
    if (updateBookingDto.paidAmount !== undefined) {
      booking.remainingAmount =
        booking.totalAmount - updateBookingDto.paidAmount;
      if (booking.remainingAmount <= 0) {
        updateBookingDto.paymentStatus = PaymentStatus.PAID;
      } else if (updateBookingDto.paidAmount > 0) {
        updateBookingDto.paymentStatus = PaymentStatus.PARTIAL;
      }
    }

    // Handle cancellation
    if (updateBookingDto.status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancelledBy = new Types.ObjectId(userId);
    }

    // Handle completion
    if (updateBookingDto.status === BookingStatus.COMPLETED) {
      booking.completedAt = new Date();
    }

    Object.assign(booking, updateBookingDto);
    return booking.save();
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking || !booking.isActive) {
      throw new NotFoundException('Booking not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      booking.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only delete your own bookings');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || booking.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only delete bookings for your business',
        );
      }
    }

    booking.isActive = false;
    await booking.save();

    return { message: 'Booking deleted successfully' };
  }

  async addReview(
    id: string,
    reviewDto: BookingReviewDto,
    userId: string,
  ): Promise<ReviewDocument> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking || !booking.isActive) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user owns this booking
    if (booking.customerId.toString() !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    // Check if booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('You can only review completed bookings');
    }

    // Check if review already exists
    const existingReview = await this.reviewModel
      .findOne({
        customerId: new Types.ObjectId(userId),
        vendorId: booking.vendorId,
        bookingId: new Types.ObjectId(id),
      })
      .exec();

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    const review = new this.reviewModel({
      ...reviewDto,
      customerId: new Types.ObjectId(userId),
      vendorId: booking.vendorId,
      bookingId: new Types.ObjectId(id),
      isVerified: true,
      publishedAt: new Date(),
    });

    const savedReview = await review.save();

    // Update vendor rating
    await this.updateVendorRating(booking.vendorId.toString());

    // Update booking with review info
    booking.rating = reviewDto.rating;
    booking.review = reviewDto.comment;
    booking.reviewDate = new Date();
    await booking.save();

    return savedReview;
  }

  private async updateVendorRating(vendorId: string): Promise<void> {
    const reviews = await this.reviewModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isPublished: true,
      })
      .exec();

    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.vendorModel
      .findByIdAndUpdate(vendorId, {
        rating: averageRating,
        reviewCount: reviews.length,
      })
      .exec();
  }

  async getBookingStats(userId: string, userRole: UserRole): Promise<any> {
    let filter: any = { isActive: true };

    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      filter.vendorId = vendor._id;
    }

    const [total, pending, confirmed, completed, cancelled] = await Promise.all(
      [
        this.bookingModel.countDocuments(filter).exec(),
        this.bookingModel
          .countDocuments({ ...filter, status: BookingStatus.PENDING })
          .exec(),
        this.bookingModel
          .countDocuments({ ...filter, status: BookingStatus.CONFIRMED })
          .exec(),
        this.bookingModel
          .countDocuments({ ...filter, status: BookingStatus.COMPLETED })
          .exec(),
        this.bookingModel
          .countDocuments({ ...filter, status: BookingStatus.CANCELLED })
          .exec(),
      ],
    );

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
    };
  }

  async getUpcomingBookings(
    userId: string,
    userRole: UserRole,
    limit: number = 5,
  ): Promise<BookingDocument[]> {
    let filter: any = {
      isActive: true,
      bookingDate: { $gte: new Date() },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
    };

    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        return [];
      }
      filter.vendorId = vendor._id;
    }

    return this.bookingModel
      .find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vendorId', 'businessName businessLogo')
      .sort({ bookingDate: 1 })
      .limit(limit)
      .exec();
  }
}
