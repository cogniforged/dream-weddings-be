import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Lead, LeadDocument } from '../schemas/lead.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
  ) {}

  async sendInquiry(customerId: string, vendorId: string, inquiryData: any) {
    const vendor = await this.userModel.findOne({
      _id: vendorId,
      role: UserRole.VENDOR,
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const lead = new this.leadModel({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
      customerName: inquiryData.customerName,
      customerEmail: inquiryData.customerEmail,
      customerPhone: inquiryData.customerPhone,
      message: inquiryData.message,
    });

    await lead.save();
    return lead;
  }

  async addToFavorites(customerId: string, vendorId: string, notes?: string) {
    const vendor = await this.userModel.findOne({
      _id: vendorId,
      role: UserRole.VENDOR,
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if already in favorites
    const existingFavorite = await this.favoriteModel.findOne({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
    });

    if (existingFavorite) {
      return existingFavorite;
    }

    const favorite = new this.favoriteModel({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
      notes,
    });

    await favorite.save();
    return favorite;
  }

  async removeFromFavorites(customerId: string, vendorId: string) {
    const result = await this.favoriteModel.deleteOne({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
    });

    return { deleted: result.deletedCount > 0 };
  }

  async getFavorites(customerId: string) {
    const favorites = await this.favoriteModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate(
        'vendorId',
        'businessName category businessDescription rating reviewCount priceRange portfolio',
      )
      .sort({ addedAt: -1 });

    return favorites;
  }

  async submitReview(customerId: string, vendorId: string, reviewData: any) {
    const vendor = await this.userModel.findOne({
      _id: vendorId,
      role: UserRole.VENDOR,
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if customer has already reviewed this vendor
    const existingReview = await this.reviewModel.findOne({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
    });

    if (existingReview) {
      throw new Error('You have already reviewed this vendor');
    }

    const review = new this.reviewModel({
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
      customerName: reviewData.customerName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      weddingDate: reviewData.weddingDate,
      serviceCategory: reviewData.serviceCategory,
      photos: reviewData.photos,
    });

    await review.save();

    // Update vendor's average rating
    await this.updateVendorRating(vendorId);

    return review;
  }

  async updateVendorRating(vendorId: string) {
    const reviews = await this.reviewModel.find({
      vendorId: new Types.ObjectId(vendorId),
    });

    if (reviews.length === 0) return;

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.userModel.findByIdAndUpdate(vendorId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length,
    });
  }

  async getMyInquiries(customerId: string) {
    const inquiries = await this.leadModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('vendorId', 'businessName category businessPhone businessEmail')
      .sort({ createdAt: -1 });

    return inquiries;
  }

  async getMyReviews(customerId: string) {
    const reviews = await this.reviewModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('vendorId', 'businessName category')
      .sort({ createdAt: -1 });

    return reviews;
  }

  async updateWeddingDetails(customerId: string, weddingData: any) {
    const user = await this.userModel.findById(customerId);
    if (!user || user.role !== UserRole.CUSTOMER) {
      throw new NotFoundException('Customer not found');
    }

    user.weddingDate = weddingData.weddingDate;
    user.budget = weddingData.budget;
    user.address = weddingData.address;
    user.city = weddingData.city;
    user.phone = weddingData.phone;

    await user.save();
    return user;
  }
}
