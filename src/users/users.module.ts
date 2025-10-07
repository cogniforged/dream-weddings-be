import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { Favorite, FavoriteSchema } from '../schemas/favorite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
