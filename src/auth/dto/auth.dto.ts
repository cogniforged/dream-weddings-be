import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { UserRole, VendorCategory } from '../../schemas/user.schema';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // Customer fields
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  weddingDate?: Date;

  @IsOptional()
  @IsNumber()
  budget?: number;

  // Vendor fields
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  businessCity?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsObject()
  priceRange?: {
    min: number;
    max: number;
  };

  @IsOptional()
  @IsArray()
  portfolio?: string[];

  @IsOptional()
  @IsArray()
  packages?: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
  }[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  weddingDate?: Date;

  @IsOptional()
  @IsNumber()
  budget?: number;

  // Vendor fields
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @IsString()
  businessDescription?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  businessCity?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsObject()
  priceRange?: {
    min: number;
    max: number;
  };

  @IsOptional()
  @IsArray()
  portfolio?: string[];

  @IsOptional()
  @IsArray()
  packages?: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
  }[];
}
