import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: any; token: string }> {
    const {
      email,
      password: userPassword,
      name,
      role,
      ...additionalData
    } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role || UserRole.CUSTOMER,
      ...additionalData,
    };

    const user = new this.userModel(userData);
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const userResponse = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = userResponse;

    return { user: userWithoutPassword, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: any; token: string }> {
    const { email, password: loginPassword } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    // Return user without password
    const userResponse = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = userResponse;

    return { user: userWithoutPassword, token };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateData: any): Promise<any> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, select: '-password' },
    );
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return this.jwtService.sign(payload);
  }

  // Vendor specific methods
  async getVendorStats(vendorId: string): Promise<any> {
    const vendor = await this.userModel.findById(vendorId);
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new UnauthorizedException('Vendor not found');
    }

    return {
      profileViews: Math.floor(Math.random() * 1000) + 500, // Mock data
      clicks: Math.floor(Math.random() * 100) + 50,
      leads: Math.floor(Math.random() * 50) + 10,
      conversionRate: Math.floor(Math.random() * 20) + 10,
      rating: vendor.rating || 0,
      reviewCount: vendor.reviewCount || 0,
    };
  }
}
