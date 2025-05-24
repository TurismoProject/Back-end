import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { ProductReview } from '@prisma/client';
import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';

@Injectable()
export class ProductReviewsRepository extends BaseRepository<
  ProductReview,
  CreateReviewDto,
  UpdateReviewDto
> {
  constructor(protected readonly prismaService: PrismaService) {
    super(prismaService);
  }

  protected get model() {
    return this.prismaService.productReview;
  }

  async getUserReviews(userId: string): Promise<Array<ProductReview>> {
    return this.prismaService.productReview.findMany({
      where: { userId },
    });
  }

  async getProductReviews(productId: string): Promise<Array<ProductReview>> {
    return this.prismaService.productReview.findMany({
      where: { productId },
    });
  }
}