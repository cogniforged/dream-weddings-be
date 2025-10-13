import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlanningService } from './planning.service';
import {
  CreatePlanningDto,
  UpdatePlanningDto,
  AddBudgetItemDto,
  UpdateBudgetItemDto,
  AddGuestDto,
  UpdateGuestDto,
  AddTimelineItemDto,
  UpdateTimelineItemDto,
  AddChecklistItemDto,
  UpdateChecklistItemDto,
} from './dto/planning.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';

@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  async create(
    @Body() createPlanningDto: CreatePlanningDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.create(createPlanningDto, user._id.toString());
  }

  @Get()
  async findOne(@CurrentUser() user: UserDocument) {
    return this.planningService.findOne(user._id.toString());
  }

  @Get('stats')
  async getPlanningStats(@CurrentUser() user: UserDocument) {
    return this.planningService.getPlanningStats(user._id.toString());
  }

  @Get('export')
  async exportPlanning(
    @CurrentUser() user: UserDocument,
    @Query('format') format?: 'json' | 'csv',
  ) {
    return this.planningService.exportPlanning(user._id.toString(), format);
  }

  @Patch()
  async update(
    @Body() updatePlanningDto: UpdatePlanningDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.update(user._id.toString(), updatePlanningDto);
  }

  @Delete()
  async remove(@CurrentUser() user: UserDocument) {
    return this.planningService.remove(user._id.toString());
  }

  // Budget endpoints
  @Post('budget')
  async addBudgetItems(
    @Body() addBudgetItemDto: AddBudgetItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.addBudgetItems(
      user._id.toString(),
      addBudgetItemDto,
    );
  }

  @Patch('budget/:itemId')
  async updateBudgetItem(
    @Param('itemId') itemId: string,
    @Body() updateBudgetItemDto: UpdateBudgetItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.updateBudgetItem(
      user._id.toString(),
      itemId,
      updateBudgetItemDto,
    );
  }

  @Delete('budget/:itemId')
  async removeBudgetItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.removeBudgetItem(user._id.toString(), itemId);
  }

  // Guest endpoints
  @Post('guests')
  async addGuests(
    @Body() addGuestDto: AddGuestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.addGuests(user._id.toString(), addGuestDto);
  }

  @Patch('guests/:guestId')
  async updateGuest(
    @Param('guestId') guestId: string,
    @Body() updateGuestDto: UpdateGuestDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.updateGuest(
      user._id.toString(),
      guestId,
      updateGuestDto,
    );
  }

  @Delete('guests/:guestId')
  async removeGuest(
    @Param('guestId') guestId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.removeGuest(user._id.toString(), guestId);
  }

  // Timeline endpoints
  @Post('timeline')
  async addTimelineItems(
    @Body() addTimelineItemDto: AddTimelineItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.addTimelineItems(
      user._id.toString(),
      addTimelineItemDto,
    );
  }

  @Patch('timeline/:itemId')
  async updateTimelineItem(
    @Param('itemId') itemId: string,
    @Body() updateTimelineItemDto: UpdateTimelineItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.updateTimelineItem(
      user._id.toString(),
      itemId,
      updateTimelineItemDto,
    );
  }

  @Delete('timeline/:itemId')
  async removeTimelineItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.removeTimelineItem(user._id.toString(), itemId);
  }

  // Checklist endpoints
  @Post('checklist')
  async addChecklistItems(
    @Body() addChecklistItemDto: AddChecklistItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.addChecklistItems(
      user._id.toString(),
      addChecklistItemDto,
    );
  }

  @Patch('checklist/:itemId')
  async updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() updateChecklistItemDto: UpdateChecklistItemDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.updateChecklistItem(
      user._id.toString(),
      itemId,
      updateChecklistItemDto,
    );
  }

  @Delete('checklist/:itemId')
  async removeChecklistItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.removeChecklistItem(
      user._id.toString(),
      itemId,
    );
  }

  // Vendor endpoints
  @Post('vendors')
  async addVendor(@Body() vendorData: any, @CurrentUser() user: UserDocument) {
    return this.planningService.addVendor(user._id.toString(), vendorData);
  }

  @Patch('vendors/:vendorIndex')
  async updateVendor(
    @Param('vendorIndex') vendorIndex: string,
    @Body() vendorData: any,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.updateVendor(
      user._id.toString(),
      parseInt(vendorIndex),
      vendorData,
    );
  }

  @Delete('vendors/:vendorIndex')
  async removeVendor(
    @Param('vendorIndex') vendorIndex: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.planningService.removeVendor(
      user._id.toString(),
      parseInt(vendorIndex),
    );
  }
}
