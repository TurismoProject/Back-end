import { AbstractBaseRepository } from '@common/repositories/abstract-base.repository';
import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';
import { ProductReview } from '@prisma/client';

export abstract class AbstractProductReviewsRepository extends AbstractBaseRepository<
  ProductReview,
  CreateReviewDto,
  UpdateReviewDto
> {
  abstract getUserReviews(userId: string): Promise<Array<ProductReview>>;
  abstract getProductReviews(productId: string): Promise<Array<ProductReview>>;
}