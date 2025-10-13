import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import { Booking, BookingDocument } from '../schemas/booking.schema';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
  VendorResponseDto,
  ReviewHelpfulDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<ReviewDocument> {
    const { vendorId, bookingId, ...reviewData } = createReviewDto;

    // Check if vendor exists
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if booking exists and belongs to user
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking || !booking.isActive) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId.toString() !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.vendorId.toString() !== vendorId) {
      throw new BadRequestException('Booking does not belong to this vendor');
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException('You can only review completed bookings');
    }

    // Check if review already exists
    const existingReview = await this.reviewModel
      .findOne({
        customerId: new Types.ObjectId(userId),
        vendorId: new Types.ObjectId(vendorId),
        bookingId: new Types.ObjectId(bookingId),
      })
      .exec();

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    const review = new this.reviewModel({
      ...reviewData,
      customerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorId),
      bookingId: new Types.ObjectId(bookingId),
      isVerified: true,
      publishedAt: new Date(),
    });

    const savedReview = await review.save();

    // Update vendor rating
    await this.updateVendorRating(vendorId);

    return savedReview.populate('customerId', 'firstName lastName');
  }

  async findAll(queryDto: ReviewQueryDto): Promise<{
    reviews: ReviewDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      vendorId,
      serviceCategory,
      minRating,
      maxRating,
      isVerified,
      hasImages,
      wouldRecommend,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: any = { isActive: true, isPublished: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { comment: { $regex: search, $options: 'i' } },
        { pros: { $in: [new RegExp(search, 'i')] } },
        { cons: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (vendorId) {
      filter.vendorId = new Types.ObjectId(vendorId);
    }

    if (serviceCategory) {
      filter.serviceCategory = serviceCategory;
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = minRating;
      if (maxRating) filter.rating.$lte = maxRating;
    }

    if (isVerified !== undefined) {
      filter.isVerified = isVerified;
    }

    if (hasImages !== undefined) {
      if (hasImages) {
        filter.images = { $exists: true, $not: { $size: 0 } };
      } else {
        filter.$or = [{ images: { $exists: false } }, { images: { $size: 0 } }];
      }
    }

    if (wouldRecommend !== undefined) {
      filter.wouldRecommend = wouldRecommend;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('customerId', 'firstName lastName')
        .populate('vendorId', 'businessName businessLogo')
        .populate('bookingId', 'serviceName serviceCategory')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findById(id)
      .populate('customerId', 'firstName lastName')
      .populate('vendorId', 'businessName businessLogo')
      .populate('bookingId', 'serviceName serviceCategory')
      .exec();

    if (!review || !review.isActive || !review.isPublished) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async findByVendor(
    vendorId: string,
    limit: number = 10,
  ): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
        isPublished: true,
      })
      .populate('customerId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review || !review.isActive) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review
    if (review.customerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    const savedReview = await review.save();

    // Update vendor rating
    await this.updateVendorRating(review.vendorId.toString());

    return savedReview;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review || !review.isActive) {
      throw new NotFoundException('Review not found');
    }

    // Check if user owns this review
    if (review.customerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    review.isActive = false;
    await review.save();

    // Update vendor rating
    await this.updateVendorRating(review.vendorId.toString());

    return { message: 'Review deleted successfully' };
  }

  async addVendorResponse(
    id: string,
    responseDto: VendorResponseDto,
    userId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review || !review.isActive) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is the vendor
    const vendor = await this.vendorModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!vendor || review.vendorId.toString() !== vendor._id.toString()) {
      throw new ForbiddenException(
        'You can only respond to reviews for your business',
      );
    }

    review.vendorResponse = responseDto.response;
    review.vendorResponseDate = new Date();

    return review.save();
  }

  async markHelpful(
    id: string,
    helpfulDto: ReviewHelpfulDto,
    userId: string,
  ): Promise<{
    message: string;
    helpfulCount: number;
    notHelpfulCount: number;
  }> {
    const review = await this.reviewModel.findById(id).exec();
    if (!review || !review.isActive) {
      throw new NotFoundException('Review not found');
    }

    // In a real implementation, you'd want to track individual votes to prevent spam
    if (helpfulDto.isHelpful) {
      review.helpfulCount += 1;
    } else {
      review.notHelpfulCount += 1;
    }

    await review.save();

    return {
      message: helpfulDto.isHelpful
        ? 'Marked as helpful'
        : 'Marked as not helpful',
      helpfulCount: review.helpfulCount,
      notHelpfulCount: review.notHelpfulCount,
    };
  }

  async getVendorRatingStats(vendorId: string): Promise<any> {
    const reviews = await this.reviewModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
        isPublished: true,
      })
      .exec();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        verifiedReviews: 0,
        reviewsWithImages: 0,
        wouldRecommendCount: 0,
      };
    }

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    const verifiedReviews = reviews.filter(
      (review) => review.isVerified,
    ).length;
    const reviewsWithImages = reviews.filter(
      (review) => review.images && review.images.length > 0,
    ).length;
    const wouldRecommendCount = reviews.filter(
      (review) => review.wouldRecommend,
    ).length;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedReviews,
      reviewsWithImages,
      wouldRecommendCount,
    };
  }

  async getRecentReviews(limit: number = 10): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        isActive: true,
        isPublished: true,
      })
      .populate('customerId', 'firstName lastName')
      .populate('vendorId', 'businessName businessLogo')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getTopRatedReviews(limit: number = 10): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({
        isActive: true,
        isPublished: true,
        rating: 5,
      })
      .populate('customerId', 'firstName lastName')
      .populate('vendorId', 'businessName businessLogo')
      .sort({ helpfulCount: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private async updateVendorRating(vendorId: string): Promise<void> {
    const reviews = await this.reviewModel
      .find({
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
        isPublished: true,
      })
      .exec();

    if (reviews.length === 0) {
      await this.vendorModel
        .findByIdAndUpdate(vendorId, {
          rating: 0,
          reviewCount: 0,
        })
        .exec();
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.vendorModel
      .findByIdAndUpdate(vendorId, {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      })
      .exec();
  }
}
