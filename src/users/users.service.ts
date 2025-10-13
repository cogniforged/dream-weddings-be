import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Favorite, FavoriteDocument } from '../schemas/favorite.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import {
  UpdateProfileDto,
  UpdateWeddingDetailsDto,
  CreateFavoriteDto,
  UpdateFavoriteDto,
  UserPreferencesDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateProfileDto);
    return user.save();
  }

  async updateWeddingDetails(
    userId: string,
    updateWeddingDetailsDto: UpdateWeddingDetailsDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateWeddingDetailsDto);
    return user.save();
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...profile } = user.toObject();
    return profile;
  }

  // Favorites management
  async addFavorite(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteDocument> {
    const { vendorId, notes, category } = createFavoriteDto;

    // Check if vendor exists
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteModel
      .findOne({
        userId: new Types.ObjectId(userId),
        vendorId: new Types.ObjectId(vendorId),
      })
      .exec();

    if (existingFavorite) {
      throw new BadRequestException('Vendor already in favorites');
    }

    const favorite = new this.favoriteModel({
      userId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorId),
      notes,
      category,
    });

    return favorite.save();
  }

  async getFavorites(userId: string): Promise<FavoriteDocument[]> {
    return this.favoriteModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .populate(
        'vendorId',
        'businessName businessDescription categories district rating reviewCount priceRange businessLogo',
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateFavorite(
    userId: string,
    favoriteId: string,
    updateFavoriteDto: UpdateFavoriteDto,
  ): Promise<FavoriteDocument> {
    const favorite = await this.favoriteModel
      .findOne({
        _id: new Types.ObjectId(favoriteId),
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .exec();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    Object.assign(favorite, updateFavoriteDto);
    return favorite.save();
  }

  async removeFavorite(
    userId: string,
    favoriteId: string,
  ): Promise<{ message: string }> {
    const favorite = await this.favoriteModel
      .findOne({
        _id: new Types.ObjectId(favoriteId),
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .exec();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    favorite.isActive = false;
    await favorite.save();

    return { message: 'Favorite removed successfully' };
  }

  async removeFavoriteByVendorId(
    userId: string,
    vendorId: string,
  ): Promise<{ message: string }> {
    const favorite = await this.favoriteModel
      .findOne({
        userId: new Types.ObjectId(userId),
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
      })
      .exec();

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    favorite.isActive = false;
    await favorite.save();

    return { message: 'Favorite removed successfully' };
  }

  async isVendorFavorited(userId: string, vendorId: string): Promise<boolean> {
    const favorite = await this.favoriteModel
      .findOne({
        userId: new Types.ObjectId(userId),
        vendorId: new Types.ObjectId(vendorId),
        isActive: true,
      })
      .exec();

    return !!favorite;
  }

  async getFavoritesByCategory(
    userId: string,
    category: string,
  ): Promise<FavoriteDocument[]> {
    return this.favoriteModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        category: category,
      })
      .populate(
        'vendorId',
        'businessName businessDescription categories district rating reviewCount priceRange businessLogo',
      )
      .sort({ createdAt: -1 })
      .exec();
  }

  // User preferences and recommendations
  async updatePreferences(
    userId: string,
    preferencesDto: UserPreferencesDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store preferences in user document or separate collection
    // For now, we'll add a preferences field to the user schema
    Object.assign(user, { preferences: preferencesDto });
    return user.save();
  }

  async getPreferences(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.preferences || {};
  }

  // User statistics
  async getUserStats(userId: string): Promise<any> {
    const [favoritesCount, user] = await Promise.all([
      this.favoriteModel
        .countDocuments({ userId: new Types.ObjectId(userId), isActive: true })
        .exec(),
      this.userModel.findById(userId).exec(),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      favoritesCount,
      profileCompletion: this.calculateProfileCompletion(user),
      memberSince: user.createdAt,
      lastLogin: user.lastLoginAt,
    };
  }

  private calculateProfileCompletion(user: UserDocument): number {
    let completion = 0;
    const fields = [
      'firstName',
      'lastName',
      'phone',
      'profileImage',
      'weddingDate',
      'weddingLocation',
      'guestCount',
      'budget',
      'weddingStyle',
    ];

    fields.forEach((field) => {
      if (user[field]) {
        completion += 1;
      }
    });

    return Math.round((completion / fields.length) * 100);
  }

  // Search history (for future implementation)
  async addSearchHistory(
    userId: string,
    searchQuery: string,
    filters: any,
  ): Promise<void> {
    // Implementation for search history tracking
    // This could be stored in a separate collection or added to user document
  }

  async getSearchHistory(userId: string): Promise<any[]> {
    // Implementation for retrieving search history
    return [];
  }
}
