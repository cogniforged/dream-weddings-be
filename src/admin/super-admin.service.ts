import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { SuperAdmin, SuperAdminDocument } from '../schemas/super-admin.schema';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectModel(SuperAdmin.name) private superAdminModel: Model<SuperAdminDocument>,
  ) {}

  async validateSuperAdmin(email: string, password: string): Promise<SuperAdminDocument | null> {
    const superAdmin = await this.superAdminModel.findOne({ email, isActive: true }).exec();
    
    if (!superAdmin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    superAdmin.lastLoginAt = new Date();
    await superAdmin.save();

    return superAdmin;
  }

  async findById(id: string): Promise<SuperAdminDocument | null> {
    return this.superAdminModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<SuperAdminDocument | null> {
    return this.superAdminModel.findOne({ email }).exec();
  }

  async getAllSuperAdmins(): Promise<SuperAdminDocument[]> {
    return this.superAdminModel.find({ isActive: true }).select('-password').exec();
  }

  async createSuperAdmin(superAdminData: Partial<SuperAdmin>): Promise<SuperAdminDocument> {
    // Check if super admin already exists
    const existingSuperAdmin = await this.superAdminModel.findOne({ email: superAdminData.email }).exec();
    if (existingSuperAdmin) {
      throw new Error('Super admin with this email already exists');
    }

    // Validate password is provided
    if (!superAdminData.password) {
      throw new Error('Password is required');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(superAdminData.password, 12);

    const superAdmin = new this.superAdminModel({
      ...superAdminData,
      password: hashedPassword,
    });

    return superAdmin.save();
  }

  async updateSuperAdmin(id: string, updateData: Partial<SuperAdmin>): Promise<SuperAdminDocument | null> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return this.superAdminModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteSuperAdmin(id: string): Promise<boolean> {
    const result = await this.superAdminModel.findByIdAndUpdate(id, { isActive: false }).exec();
    return !!result;
  }
}
