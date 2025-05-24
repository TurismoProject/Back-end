import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AbstractProductReviewsRepository } from '@repositories/reviews/abstract-product-reviews.repository';
import { AbstractSupplierReviewsRepository } from '@repositories/reviews/abstract-supplier-reviews.repository';

@Controller('review')
export class ReviewController {
  constructor(
    private readonly productReviewsRepository: AbstractProductReviewsRepository,
    private readonly supplierReviewsRepository: AbstractSupplierReviewsRepository
  ) {}

  @Get('usuario/:id')
  async getUserReviews(@Param('id') id: string) {
    const productReviews =
      await this.productReviewsRepository.getUserReviews(id);
    const supplierReviews =
      await this.supplierReviewsRepository.getUserReviews(id);
    return { productReviews, supplierReviews };
  }

  @Get('produto/:id')
  async getProductReviews(@Param('id') id: string) {
    return this.productReviewsRepository.getProductReviews(id);
  }

  @Get('provedor/:id')
  async getSupplierReviews(@Param('id') id: string) {
    return this.supplierReviewsRepository.getSupplierReviews(id);
  }

  @Post('criar')
  async createReview(@Body() data: CreateReviewDto) {
    if (data.productId) {
      return this.productReviewsRepository.create(data);
    }
    return this.supplierReviewsRepository.create(data);
  }

  @Put('atualizar')
  async updateReview(@Body() data: UpdateReviewDto) {
    if (data.productId) {
      return this.productReviewsRepository.update(data.id, data);
    }
    return this.supplierReviewsRepository.update(data.id, data);
  }

  @Delete('excluir/:id')
  async deleteReview(@Param('id') id: string) {
    // TODO: This requires additional logic to determine which repository to use
    try {
      return await this.productReviewsRepository.delete(id);
    } catch (error) {
      return await this.supplierReviewsRepository.delete(id);
    }
  }
}
