import { CreateReviewDto } from '@dtos/create-review.dto';
import { UpdateReviewDto } from '@dtos/update-review.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AbstractReviewsRepository } from '@repositories/reviews/abstract-reviews.repository';

@Controller('review')
export class ReviewController {
  constructor(private readonly repository: AbstractReviewsRepository) {}

  @Get('usuario/:id')
  async getUserReviews(@Param('id') id: string) {
    return this.repository.getUserReviews(id);
  }

  @Get('produto/:id')
  async getProductReviews(@Param('id') id: string) {
    return this.repository.getProductReviews(id);
  }

  @Get('provedor/:id')
  async getSupplierReviews(@Param('id') id: string) {
    return this.repository.getSupplierReviews(id);
  }

  @Post('criar')
  async createReview(@Body() data: CreateReviewDto) {
    return this.repository.createReview(data);
  }

  @Patch('atualizar')
  async updateReview(@Body() data: UpdateReviewDto) {
    return this.repository.updateReview(data);
  }

  @Delete('excluir/:id')
  async deleteReview(@Param('id') id: string) {
    return this.repository.deleteReview(id);
  }
}
