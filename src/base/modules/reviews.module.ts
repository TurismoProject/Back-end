import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ReviewController } from '@controllers/reviews.controller';
import { AbstractReviewsRepository } from '@repositories/reviews/abstract-reviews.repository';
import { ReviewsRepository } from '@repositories/reviews/reviews.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewController],
  providers: [
    {
      provide: AbstractReviewsRepository,
      useClass: ReviewsRepository,
    },
  ],
})
export class ReviewsModule {}
