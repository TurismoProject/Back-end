import { Injectable } from '@nestjs/common';
import { AbstractReviewsRepository } from './abstract-reviews.repository';
import { CreateReviewDto } from '@dtos/create-review.dto';
import { ProductReview, SupplierReview } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { UpdateReviewDto } from '@dtos/update-review.dto';

@Injectable()
export class ReviewsRepository implements AbstractReviewsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createReview(
    data: CreateReviewDto,
  ): Promise<ProductReview | SupplierReview> {
    if (data.productId) {
      const productReview = await this.prismaService.productReview.create({
        data,
      });

      return productReview;
    }

    const supplierReview = await this.prismaService.supplierReview.create({
      data,
    });

    return supplierReview;
  }

  async updateReview(
    data: UpdateReviewDto,
  ): Promise<ProductReview | SupplierReview> {
    if (data.productId) {
      const productReview = await this.prismaService.productReview.update({
        where: { id: data.id },
        data,
      });

      return productReview;
    }

    const supplierReview = await this.prismaService.supplierReview.update({
      where: { id: data.id },
      data,
    });

    return supplierReview;
  }

  async deleteReview(id: string): Promise<null> {
    await this.prismaService.productReview.delete({
      where: { id },
    });

    return;
  }

  async getProductReviews(id: string): Promise<Array<ProductReview>> {
    return this.prismaService.productReview.findMany({
      where: { productId: id },
    });
  }

  async getSupplierReviews(id: string): Promise<Array<SupplierReview>> {
    return this.prismaService.supplierReview.findMany({
      where: { supplierId: id },
    });
  }

  async getUserReviews(id: string): Promise<{
    supplierReviews: Array<SupplierReview>;
    productReviews: Array<ProductReview>;
  }> {
    const supplierReviews = await this.prismaService.supplierReview.findMany({
      where: { userId: id },
    });

    const productReviews = await this.prismaService.productReview.findMany({
      where: { userId: id },
    });

    return { supplierReviews, productReviews };
  }
}
