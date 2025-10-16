import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PortfolioItemDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreatePortfolioDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  items: PortfolioItemDto[];

  @IsOptional()
  @IsDateString()
  projectDate?: Date;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsString()
  challenges?: string;

  @IsOptional()
  @IsString()
  solutions?: string;

  @IsOptional()
  @IsString()
  testimonials?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdatePortfolioDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  items?: PortfolioItemDto[];

  @IsOptional()
  @IsDateString()
  projectDate?: Date;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsString()
  challenges?: string;

  @IsOptional()
  @IsString()
  solutions?: string;

  @IsOptional()
  @IsString()
  testimonials?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class PortfolioQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'projectDate' | 'viewCount' | 'likeCount';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
