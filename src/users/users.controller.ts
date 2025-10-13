import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Delete,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpdateWeddingDetailsDto,
  CreateFavoriteDto,
  UpdateFavoriteDto,
  UserPreferencesDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.getProfile(user._id.toString());
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      user._id.toString(),
      updateProfileDto,
    );
  }

  @Patch('wedding-details')
  async updateWeddingDetails(
    @CurrentUser() user: UserDocument,
    @Body() updateWeddingDetailsDto: UpdateWeddingDetailsDto,
  ) {
    return this.usersService.updateWeddingDetails(
      user._id.toString(),
      updateWeddingDetailsDto,
    );
  }

  @Get('stats')
  async getUserStats(@CurrentUser() user: UserDocument) {
    return this.usersService.getUserStats(user._id.toString());
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: UserDocument) {
    return this.usersService.getPreferences(user._id.toString());
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: UserDocument,
    @Body() preferencesDto: UserPreferencesDto,
  ) {
    return this.usersService.updatePreferences(
      user._id.toString(),
      preferencesDto,
    );
  }

  // Favorites endpoints
  @Post('favorites')
  async addFavorite(
    @CurrentUser() user: UserDocument,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.usersService.addFavorite(
      user._id.toString(),
      createFavoriteDto,
    );
  }

  @Get('favorites')
  async getFavorites(@CurrentUser() user: UserDocument) {
    return this.usersService.getFavorites(user._id.toString());
  }

  @Get('favorites/category/:category')
  async getFavoritesByCategory(
    @CurrentUser() user: UserDocument,
    @Param('category') category: string,
  ) {
    return this.usersService.getFavoritesByCategory(
      user._id.toString(),
      category,
    );
  }

  @Patch('favorites/:id')
  async updateFavorite(
    @CurrentUser() user: UserDocument,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateFavoriteDto: UpdateFavoriteDto,
  ) {
    return this.usersService.updateFavorite(
      user._id.toString(),
      id.toString(),
      updateFavoriteDto,
    );
  }

  @Delete('favorites/:id')
  async removeFavorite(
    @CurrentUser() user: UserDocument,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.usersService.removeFavorite(user._id.toString(), id.toString());
  }

  @Delete('favorites/vendor/:vendorId')
  async removeFavoriteByVendorId(
    @CurrentUser() user: UserDocument,
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
  ) {
    return this.usersService.removeFavoriteByVendorId(
      user._id.toString(),
      vendorId.toString(),
    );
  }

  @Get('favorites/check/:vendorId')
  async isVendorFavorited(
    @CurrentUser() user: UserDocument,
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
  ) {
    return this.usersService.isVendorFavorited(
      user._id.toString(),
      vendorId.toString(),
    );
  }

  // Search history endpoints (for future implementation)
  @Get('search-history')
  async getSearchHistory(@CurrentUser() user: UserDocument) {
    return this.usersService.getSearchHistory(user._id.toString());
  }
}
