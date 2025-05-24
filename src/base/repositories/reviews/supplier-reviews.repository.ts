import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@common/repositories/base.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { SupplierReview } from '@prisma/client';
import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';

@Injectable()
export class SupplierReviewsRepository extends BaseRepository<
  SupplierReview,
  CreateReviewDto,
  UpdateReviewDto
> {
  constructor(protected readonly prismaService: PrismaService) {
    super(prismaService);
  }

  protected get model() {
    return this.prismaService.supplierReview;
  }

  async getUserReviews(userId: string): Promise<Array<SupplierReview>> {
    return this.prismaService.supplierReview.findMany({
      where: { userId },
    });
  }

  async getSupplierReviews(supplierId: string): Promise<Array<SupplierReview>> {
    return this.prismaService.supplierReview.findMany({
      where: { supplierId },
    });
  }
}
