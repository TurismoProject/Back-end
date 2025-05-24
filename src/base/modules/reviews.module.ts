import { Module } from '@nestjs/common';
import { DatabaseModule } from './database.module';
import { ReviewController } from '@controllers/reviews.controller';
import { AbstractProductReviewsRepository } from '@repositories/reviews/abstract-product-reviews.repository';
import { ProductReviewsRepository } from '@repositories/reviews/product-reviews.repository';
import { AbstractSupplierReviewsRepository } from '@repositories/reviews/abstract-supplier-reviews.repository';
import { SupplierReviewsRepository } from '@repositories/reviews/supplier-reviews.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewController],
  providers: [
    {
      provide: AbstractProductReviewsRepository,
      useClass: ProductReviewsRepository,
    },
    {
      provide: AbstractSupplierReviewsRepository,
      useClass: SupplierReviewsRepository,
    },
  ],
})
export class ReviewsModule {}
