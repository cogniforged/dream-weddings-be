import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Planning,
  PlanningDocument,
  BudgetItemDocument,
  GuestDocument,
  TimelineItemDocument,
  ChecklistItemDocument,
} from '../schemas/planning.schema';
import { User, UserDocument } from '../schemas/user.schema';
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

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(Planning.name) private planningModel: Model<PlanningDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    createPlanningDto: CreatePlanningDto,
    userId: string,
  ): Promise<PlanningDocument> {
    // Check if user already has a planning document
    const existingPlanning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (existingPlanning) {
      throw new ForbiddenException(
        'Planning document already exists for this user',
      );
    }

    const planning = new this.planningModel({
      ...createPlanningDto,
      userId: new Types.ObjectId(userId),
      budgetItems: [],
      guests: [],
      timeline: [],
      checklist: [],
      progress: {
        budget: 0,
        guests: 0,
        timeline: 0,
        checklist: 0,
      },
    });

    return planning.save();
  }

  async findOne(userId: string): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }
    return planning;
  }

  async update(
    userId: string,
    updatePlanningDto: UpdatePlanningDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    Object.assign(planning, updatePlanningDto);
    return planning.save();
  }

  async remove(userId: string): Promise<{ message: string }> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    planning.isActive = false;
    await planning.save();

    return { message: 'Planning document deleted successfully' };
  }

  // Budget management
  async addBudgetItems(
    userId: string,
    addBudgetItemDto: AddBudgetItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    // Map DTOs to schema objects with defaults
    const budgetItemsWithDefaults = addBudgetItemDto.items.map((item) => ({
      ...item,
      actualAmount: item.actualAmount ?? 0,
      isPaid: item.isPaid ?? false,
      isActive: item.isActive ?? true,
    }));
    planning.budgetItems.push(...budgetItemsWithDefaults);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.budget = this.calculateBudgetProgress(
      planning.budgetItems,
    );

    return planning.save();
  }

  async updateBudgetItem(
    userId: string,
    itemId: string,
    updateBudgetItemDto: UpdateBudgetItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    const itemIndex = planning.budgetItems.findIndex(
      (item) => (item as BudgetItemDocument)._id?.toString() === itemId,
    );
    if (itemIndex === -1) {
      throw new NotFoundException('Budget item not found');
    }

    Object.assign(planning.budgetItems[itemIndex], updateBudgetItemDto);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.budget = this.calculateBudgetProgress(
      planning.budgetItems,
    );

    return planning.save();
  }

  async removeBudgetItem(
    userId: string,
    itemId: string,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    planning.budgetItems = planning.budgetItems.filter(
      (item) => (item as BudgetItemDocument)._id?.toString() !== itemId,
    );
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.budget = this.calculateBudgetProgress(
      planning.budgetItems,
    );

    return planning.save();
  }

  // Guest management
  async addGuests(
    userId: string,
    addGuestDto: AddGuestDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    // Map DTOs to schema objects with defaults
    const guestsWithDefaults = addGuestDto.guests.map((guest) => ({
      ...guest,
      isActive: guest.isActive ?? true,
    }));
    planning.guests.push(...guestsWithDefaults);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.guests = this.calculateGuestProgress(planning.guests);

    return planning.save();
  }

  async updateGuest(
    userId: string,
    guestId: string,
    updateGuestDto: UpdateGuestDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    const guestIndex = planning.guests.findIndex(
      (guest) => (guest as GuestDocument)._id?.toString() === guestId,
    );
    if (guestIndex === -1) {
      throw new NotFoundException('Guest not found');
    }

    Object.assign(planning.guests[guestIndex], updateGuestDto);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.guests = this.calculateGuestProgress(planning.guests);

    return planning.save();
  }

  async removeGuest(
    userId: string,
    guestId: string,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    planning.guests = planning.guests.filter(
      (guest) => (guest as GuestDocument)._id?.toString() !== guestId,
    );
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.guests = this.calculateGuestProgress(planning.guests);

    return planning.save();
  }

  // Timeline management
  async addTimelineItems(
    userId: string,
    addTimelineItemDto: AddTimelineItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    // Map DTOs to schema objects with defaults
    const timelineItemsWithDefaults = addTimelineItemDto.items.map((item) => ({
      ...item,
      isActive: item.isActive ?? true,
    }));
    planning.timeline.push(...timelineItemsWithDefaults);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.timeline = this.calculateTimelineProgress(
      planning.timeline,
    );

    return planning.save();
  }

  async updateTimelineItem(
    userId: string,
    itemId: string,
    updateTimelineItemDto: UpdateTimelineItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    const itemIndex = planning.timeline.findIndex(
      (item) => (item as TimelineItemDocument)._id?.toString() === itemId,
    );
    if (itemIndex === -1) {
      throw new NotFoundException('Timeline item not found');
    }

    Object.assign(planning.timeline[itemIndex], updateTimelineItemDto);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.timeline = this.calculateTimelineProgress(
      planning.timeline,
    );

    return planning.save();
  }

  async removeTimelineItem(
    userId: string,
    itemId: string,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    planning.timeline = planning.timeline.filter(
      (item) => (item as TimelineItemDocument)._id?.toString() !== itemId,
    );
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.timeline = this.calculateTimelineProgress(
      planning.timeline,
    );

    return planning.save();
  }

  // Checklist management
  async addChecklistItems(
    userId: string,
    addChecklistItemDto: AddChecklistItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    // Map DTOs to schema objects with defaults
    const checklistItemsWithDefaults = addChecklistItemDto.items.map(
      (item) => ({
        ...item,
        isCompleted: item.isCompleted ?? false,
        isActive: item.isActive ?? true,
      }),
    );
    planning.checklist.push(...checklistItemsWithDefaults);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.checklist = this.calculateChecklistProgress(
      planning.checklist,
    );

    return planning.save();
  }

  async updateChecklistItem(
    userId: string,
    itemId: string,
    updateChecklistItemDto: UpdateChecklistItemDto,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    const itemIndex = planning.checklist.findIndex(
      (item) => (item as ChecklistItemDocument)._id?.toString() === itemId,
    );
    if (itemIndex === -1) {
      throw new NotFoundException('Checklist item not found');
    }

    Object.assign(planning.checklist[itemIndex], updateChecklistItemDto);
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.checklist = this.calculateChecklistProgress(
      planning.checklist,
    );

    return planning.save();
  }

  async removeChecklistItem(
    userId: string,
    itemId: string,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    planning.checklist = planning.checklist.filter(
      (item) => (item as ChecklistItemDocument)._id?.toString() !== itemId,
    );
    if (!planning.progress) {
      planning.progress = { budget: 0, guests: 0, timeline: 0, checklist: 0 };
    }
    planning.progress.checklist = this.calculateChecklistProgress(
      planning.checklist,
    );

    return planning.save();
  }

  // Vendor management
  async addVendor(userId: string, vendorData: any): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    if (!planning.vendors) {
      planning.vendors = [];
    }

    planning.vendors.push(vendorData);
    return planning.save();
  }

  async updateVendor(
    userId: string,
    vendorIndex: number,
    vendorData: any,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    if (!planning.vendors || vendorIndex >= planning.vendors.length) {
      throw new NotFoundException('Vendor not found');
    }

    Object.assign(planning.vendors[vendorIndex], vendorData);
    return planning.save();
  }

  async removeVendor(
    userId: string,
    vendorIndex: number,
  ): Promise<PlanningDocument> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    if (!planning.vendors || vendorIndex >= planning.vendors.length) {
      throw new NotFoundException('Vendor not found');
    }

    planning.vendors.splice(vendorIndex, 1);
    return planning.save();
  }

  // Progress calculation methods
  private calculateBudgetProgress(budgetItems: any[]): number {
    if (budgetItems.length === 0) return 0;

    const completedItems = budgetItems.filter((item) => item.isPaid).length;
    return Math.round((completedItems / budgetItems.length) * 100);
  }

  private calculateGuestProgress(guests: any[]): number {
    if (guests.length === 0) return 0;

    const confirmedGuests = guests.filter(
      (guest) => guest.rsvpStatus === 'confirmed',
    ).length;
    return Math.round((confirmedGuests / guests.length) * 100);
  }

  private calculateTimelineProgress(timeline: any[]): number {
    if (timeline.length === 0) return 0;

    const completedItems = timeline.filter(
      (item) => item.status === 'completed',
    ).length;
    return Math.round((completedItems / timeline.length) * 100);
  }

  private calculateChecklistProgress(checklist: any[]): number {
    if (checklist.length === 0) return 0;

    const completedItems = checklist.filter((item) => item.isCompleted).length;
    return Math.round((completedItems / checklist.length) * 100);
  }

  // Statistics and analytics
  async getPlanningStats(userId: string): Promise<any> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    const totalBudget = planning.budgetItems.reduce(
      (sum, item) => sum + item.plannedAmount,
      0,
    );
    const spentBudget = planning.budgetItems.reduce(
      (sum, item) => sum + (item.actualAmount || 0),
      0,
    );
    const remainingBudget = totalBudget - spentBudget;

    const totalGuests = planning.guests.length;
    const confirmedGuests = planning.guests.filter(
      (guest) => guest.rsvpStatus === 'confirmed',
    ).length;
    const pendingGuests = planning.guests.filter(
      (guest) => guest.rsvpStatus === 'pending',
    ).length;

    const totalTimelineItems = planning.timeline.length;
    const completedTimelineItems = planning.timeline.filter(
      (item) => item.status === 'completed',
    ).length;
    const overdueItems = planning.timeline.filter(
      (item) =>
        item.status !== 'completed' && new Date(item.dueDate) < new Date(),
    ).length;

    const totalChecklistItems = planning.checklist.length;
    const completedChecklistItems = planning.checklist.filter(
      (item) => item.isCompleted,
    ).length;

    return {
      budget: {
        total: totalBudget,
        spent: spentBudget,
        remaining: remainingBudget,
        progress: planning.progress?.budget ?? 0,
      },
      guests: {
        total: totalGuests,
        confirmed: confirmedGuests,
        pending: pendingGuests,
        progress: planning.progress?.guests ?? 0,
      },
      timeline: {
        total: totalTimelineItems,
        completed: completedTimelineItems,
        overdue: overdueItems,
        progress: planning.progress?.timeline ?? 0,
      },
      checklist: {
        total: totalChecklistItems,
        completed: completedChecklistItems,
        progress: planning.progress?.checklist ?? 0,
      },
      overallProgress: Math.round(
        ((planning.progress?.budget ?? 0) +
          (planning.progress?.guests ?? 0) +
          (planning.progress?.timeline ?? 0) +
          (planning.progress?.checklist ?? 0)) /
          4,
      ),
    };
  }

  // Export functionality
  async exportPlanning(
    userId: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<any> {
    const planning = await this.planningModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!planning) {
      throw new NotFoundException('Planning document not found');
    }

    if (format === 'csv') {
      // Convert to CSV format
      return this.convertToCSV(planning);
    }

    return planning.toObject();
  }

  private convertToCSV(planning: PlanningDocument): string {
    // Simple CSV conversion - in a real implementation, you'd use a proper CSV library
    let csv = 'Category,Item,Planned Amount,Actual Amount,Status\n';

    planning.budgetItems.forEach((item) => {
      csv += `${item.category},${item.item},${item.plannedAmount},${item.actualAmount || 0},${item.isPaid ? 'Paid' : 'Pending'}\n`;
    });

    return csv;
  }
}
