import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('inquiry/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send inquiry to vendor' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 201, description: 'Inquiry sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({ description: 'Inquiry data' })
  async sendInquiry(
    @Request() req,
    @Param('vendorId') vendorId: string,
    @Body() inquiryData: any,
  ) {
    return this.usersService.sendInquiry(req.user._id, vendorId, inquiryData);
  }

  @Post('favorites/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add vendor to favorites' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 201, description: 'Vendor added to favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({
    schema: { type: 'object', properties: { notes: { type: 'string' } } },
  })
  async addToFavorites(
    @Request() req,
    @Param('vendorId') vendorId: string,
    @Body() body: { notes?: string },
  ) {
    return this.usersService.addToFavorites(req.user._id, vendorId, body.notes);
  }

  @Put('favorites/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove vendor from favorites' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor removed from favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async removeFromFavorites(
    @Request() req,
    @Param('vendorId') vendorId: string,
  ) {
    return this.usersService.removeFromFavorites(req.user._id, vendorId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async getFavorites(@Request() req) {
    return this.usersService.getFavorites(req.user._id);
  }

  @Post('reviews/:vendorId')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit review for vendor' })
  @ApiParam({ name: 'vendorId', description: 'Vendor ID' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({ description: 'Review data' })
  async submitReview(
    @Request() req,
    @Param('vendorId') vendorId: string,
    @Body() reviewData: any,
  ) {
    return this.usersService.submitReview(req.user._id, vendorId, reviewData);
  }

  @Get('inquiries')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user inquiries' })
  @ApiResponse({ status: 200, description: 'Inquiries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async getMyInquiries(@Request() req) {
    return this.usersService.getMyInquiries(req.user._id);
  }

  @Get('reviews')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async getMyReviews(@Request() req) {
    return this.usersService.getMyReviews(req.user._id);
  }

  @Put('wedding-details')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update wedding details' })
  @ApiResponse({
    status: 200,
    description: 'Wedding details updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({ description: 'Wedding details data' })
  async updateWeddingDetails(@Request() req, @Body() weddingData: any) {
    return this.usersService.updateWeddingDetails(req.user._id, weddingData);
  }
}
