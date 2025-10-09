import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard';
import { StrictVendorAccessGuard } from '../auth/guards/strict-vendor-access.guard';
import { VendorDashboardGuard } from '../auth/guards/vendor-dashboard.guard';
import {
  StrictVendorAccess,
  VendorDashboardAccess,
  VendorOperationsAccess,
} from '../auth/decorators/strict-vendor.decorator';
import { UserRole } from '../schemas/user.schema';
import { LeadStatus } from '../schemas/lead.schema';

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
  })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  async getAllVendors(@Query() query: any) {
    return this.vendorsService.getAllVendors(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Vendor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get vendor reviews' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor reviews retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getVendorReviews(@Param('id') id: string) {
    return this.vendorsService.getVendorReviews(id);
  }

  @Get('me/leads')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor leads' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: LeadStatus,
    description: 'Filter by lead status',
  })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async getMyLeads(@Request() req, @Query('status') status?: LeadStatus) {
    return this.vendorsService.getVendorLeads(req.user._id, status);
  }

  @Put('me/leads/:leadId/status')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update lead status' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { enum: Object.values(LeadStatus) },
        notes: { type: 'string' },
      },
      required: ['status'],
    },
  })
  async updateLeadStatus(
    @Request() req,
    @Param('leadId') leadId: string,
    @Body() body: { status: LeadStatus; notes?: string },
  ) {
    return this.vendorsService.updateLeadStatus(
      req.user._id,
      leadId,
      body.status,
      body.notes,
    );
  }

  @Post('me/leads/:leadId/contact')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Contact lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  @ApiResponse({ status: 201, description: 'Lead contacted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  })
  async contactLead(
    @Request() req,
    @Param('leadId') leadId: string,
    @Body() body: { message: string },
  ) {
    return this.vendorsService.contactLead(req.user._id, leadId, body.message);
  }

  @Post('me/leads/:leadId/quote')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Send quote to lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  @ApiResponse({ status: 201, description: 'Quote sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quoteAmount: { type: 'number' },
        quoteDetails: { type: 'string' },
      },
      required: ['quoteAmount', 'quoteDetails'],
    },
  })
  async sendQuote(
    @Request() req,
    @Param('leadId') leadId: string,
    @Body() body: { quoteAmount: number; quoteDetails: string },
  ) {
    return this.vendorsService.sendQuote(
      req.user._id,
      leadId,
      body.quoteAmount,
      body.quoteDetails,
    );
  }

  @Put('me/portfolio')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update vendor portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { portfolio: { type: 'array', items: { type: 'string' } } },
      required: ['portfolio'],
    },
  })
  async updatePortfolio(@Request() req, @Body() body: { portfolio: string[] }) {
    return this.vendorsService.updatePortfolio(req.user._id, body.portfolio);
  }

  @Put('me/packages')
  @UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
  @VendorOperationsAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update vendor packages' })
  @ApiResponse({ status: 200, description: 'Packages updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { packages: { type: 'array', items: { type: 'object' } } },
      required: ['packages'],
    },
  })
  async updatePackages(@Request() req, @Body() body: { packages: any[] }) {
    return this.vendorsService.updatePackages(req.user._id, body.packages);
  }

  @Get('me/analytics')
  @UseGuards(VendorAuthGuard, VendorDashboardGuard)
  @VendorDashboardAccess()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get vendor analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async getMyAnalytics(@Request() req) {
    return this.vendorsService.getVendorAnalytics(req.user._id);
  }
}
