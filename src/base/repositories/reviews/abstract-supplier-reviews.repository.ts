import { AbstractBaseRepository } from '@common/repositories/abstract-base.repository';
import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';
import { SupplierReview } from '@prisma/client';

export abstract class AbstractSupplierReviewsRepository extends AbstractBaseRepository<
  SupplierReview,
  CreateReviewDto,
  UpdateReviewDto
> {
  abstract getUserReviews(userId: string): Promise<Array<SupplierReview>>;
  abstract getSupplierReviews(
    supplierId: string
  ): Promise<Array<SupplierReview>>;
}
