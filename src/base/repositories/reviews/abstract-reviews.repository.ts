import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';
import { ProductReview, SupplierReview } from '@prisma/client';

export abstract class AbstractReviewsRepository {
  abstract getUserReviews(id: string): Promise<{
    supplierReviews: Array<SupplierReview>;
    productReviews: Array<ProductReview>;
  }>;
  abstract getProductReviews(id: string): Promise<Array<ProductReview>>;
  abstract getSupplierReviews(id: string): Promise<Array<SupplierReview>>;
  abstract createReview(
    data: CreateReviewDto,
  ): Promise<ProductReview | SupplierReview>;
  abstract updateReview(
    data: UpdateReviewDto,
  ): Promise<ProductReview | SupplierReview>;
  abstract deleteReview(uuid: string): Promise<null>;
}
