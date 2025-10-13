import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class UpdateWeddingDetailsDto {
  @IsOptional()
  @IsDateString()
  weddingDate?: Date;

  @IsOptional()
  @IsString()
  weddingLocation?: string;

  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  weddingStyle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];
}

export class CreateFavoriteDto {
  @IsString()
  vendorId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateFavoriteDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UserPreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDistricts?: string[];

  @IsOptional()
  @IsObject()
  budgetRange?: {
    min: number;
    max: number;
  };

  @IsOptional()
  @IsString()
  weddingStyle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
