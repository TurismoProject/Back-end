import { AbstractProductsRepository } from './abstract-products.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product, DayOfWeek, WorkingHours, $Enums } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { v4 as uuidv4 } from 'uuid';
import { removePropertyForEach } from '@utils/utils';
import { ProductImageService } from '@services/product-image.service';
import { SearchProductDto } from '@dtos/search-product.dto';
import { AvailabilityParamsDto } from '@dtos/availability-params.dto';
import { ProductFiltersDto } from '@dtos/filter-product.dto';
import { BaseRepository } from '@common/repositories/base.repository';
import { Decimal, JsonValue } from '@prisma/client/runtime/library';

@Injectable()
export class ProductsRepository
  extends BaseRepository<Product, CreateProductDto, UpdateProductDto>
  implements AbstractProductsRepository
{
  constructor(
    protected readonly prismaService: PrismaService,
    private readonly productImageService: ProductImageService
  ) {
    super(prismaService);
  }

  protected get model() {
    return this.prismaService.product;
  }

  override findAll: never;

  async create(
    data: CreateProductDto
  ): Promise<
    Product & { workingHours: Omit<Omit<WorkingHours, 'id'>, 'productId'>[] }
  > {
    const id = uuidv4();
    const product = await this.prismaService.product.create({
      data: {
        id,
        description: data.description,
        name: data.name,
        price: data.price,
        supplier: {
          connect: {
            id: data.supplierId,
          },
        },
        categories: data.categories,
        duration: data.duration,
        maxGroupSize: data.maxGroupSize || 1,
        cancellationPolicy: data.cancellationPolicy,
        endingPoint: data.endingPoint,
        meetingPoint: data.meetingPoint,
        minAge: data.minAge,
        languages: data.languages,
        excludedItems: data.excludedItems,
        includedItems: data.includedItems,
        itinerary: data.itinerary,
        b2bAvailable: data.b2bAvailable || false,
        b2bMinQuantity: data.b2bMinQuantity,
        b2bDiscount: data.b2bDiscount,
        bulkAvailability: data.bulkAvailability || 0,
        workingHours: {
          create: this.mapWorkingHoursForCreate(data.workingHours),
        },
      },
      include: {
        workingHours: true,
      },
    });

    // Process working hours for return
    if (product.workingHours) {
      removePropertyForEach(product.workingHours, 'id');
      removePropertyForEach(product.workingHours, 'productId');
    }

    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.model.findUnique({
      where: { id },
      include: {
        reviews: true,
        availability: true,
        workingHours: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, product: UpdateProductDto): Promise<Product> {
    try {
      return await this.model.update({
        where: { id },
        data: {
          description: product.description,
          name: product.name,
          price: product.price,
          maxGroupSize: product.maxGroupSize,
          excludedItems: product.excludedItems,
          includedItems: product.includedItems,
          cancellationPolicy: product.cancellationPolicy,
          endingPoint: product.endingPoint,
          meetingPoint: product.meetingPoint,
          minAge: product.minAge,
          languages: product.languages,
          b2bAvailable: product.b2bAvailable,
          b2bMinQuantity: product.b2bMinQuantity,
          b2bDiscount: product.b2bDiscount,
          bulkAvailability: product.bulkAvailability,
          workingHours: {
            deleteMany: {},
            create: this.mapWorkingHoursForCreate(product.workingHours),
          },
        },
        include: {
          workingHours: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      throw error; // Re-throw other errors for proper handling
    }
  }

  async delete(id: string): Promise<null> {
    const product = await this.findById(id);

    // Delete all images associated with the product
    for (const image of product.images) {
      await this.removeImage(id, image);
    }

    await super.delete(id);
    return null;
  }

  async findAllSupplierProducts(): Promise<Array<Product>> {
    return this.model.findMany({
      include: {
        workingHours: true,
        reviews: true,
        availability: true,
      },
    });
  }

  // Image management methods - delegating to ProductImageService
  async addImageToProduct(
    productId: string,
    image: Express.Multer.File
  ): Promise<string> {
    return this.productImageService.addImageToProduct(productId, image);
  }

  async removeImage(productId: string, image: string): Promise<void> {
    return this.productImageService.removeImage(productId, image);
  }

  async updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>
  ): Promise<void> {
    return this.productImageService.updateProductImagePosition(
      productId,
      imagesPositionsArray
    );
  }

  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    return this.productImageService.deleteAllImagesBySupplierId(supplierId);
  }

  async search(params: SearchProductDto): Promise<Array<Product>> {
    const {
      limit = 20,
      name,
      category,
      minRating,
      minPrice,
      maxPrice,
      maxGroupSize,
      b2bOnly,
    } = params;

    // Build the where clause based on provided filters
    const whereClause: any = {};

    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (category) {
      whereClause.categories = {
        has: category,
      };
    }

    if (minRating) {
      whereClause.rating = {
        gte: minRating,
      };
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = minPrice;
      if (maxPrice) whereClause.price.lte = maxPrice;
    }

    if (maxGroupSize) {
      whereClause.maxGroupSize = {
        gte: maxGroupSize,
      };
    }

    if (b2bOnly) {
      whereClause.b2bAvailable = true;
    }

    // Execute the query with the constructed where clause
    return this.model.findMany({
      where: whereClause,
      take: limit,
      include: {
        workingHours: true,
        reviews: true,
        availability: true,
      },
    });
  }

  async checkAvailability(params: AvailabilityParamsDto): Promise<boolean> {
    const { productId, startDate, endDate, guestCount } = params;

    // Fetch product with relevant availability and working hours
    const product = await this.model.findUnique({
      where: { id: productId },
      include: {
        availability: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        workingHours: true,
      },
    });

    // Validate product exists
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if guest count exceeds max group size
    if (guestCount > product.maxGroupSize) {
      return false;
    }

    // Check if any dates in the range are already booked
    const hasBookedDates = product.availability.some((date) => date.isBooked);
    if (hasBookedDates) {
      return false;
    }

    // Check if the requested day and time are within working hours
    const dayOfWeek = this.mapToDayOfWeek(startDate.getDay());
    const workingHoursForDay = product.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable
    );

    if (!workingHoursForDay) {
      return false;
    }

    // Check if requested time is within working hours
    const requestedTime = startDate.toTimeString().slice(0, 5);
    return (
      requestedTime >= workingHoursForDay.startTime &&
      requestedTime <= workingHoursForDay.endTime
    );
  }

  async getFilters(): Promise<ProductFiltersDto> {
    // Fetch all products with their reviews in a single query
    const products = await this.model.findMany({
      select: {
        categories: true,
        price: true,
        maxGroupSize: true,
        rating: true,
      },
    });

    if (products.length === 0) {
      return {
        categories: [],
        maxPrice: 0,
        minPrice: 0,
        maxGroupSize: 0,
        minRating: 0,
      };
    }

    // Extract unique categories using Set
    const allCategories = products.flatMap((product) => product.categories);
    const categories = [...new Set(allCategories)];

    // Calculate price ranges directly
    const prices = products.map((product) => product.price.toNumber());
    const maxPrice = Math.max(...prices, 0);
    const minPrice = Math.min(...prices, 0);

    // Calculate max group size directly
    const maxGroupSize = Math.max(
      ...products.map((product) => product.maxGroupSize),
      0
    );

    // Calculate min rating directly
    const ratings = products.map((product) => product.rating.toNumber());
    const minRating = Math.min(...ratings, 0);

    return {
      categories,
      maxPrice,
      minPrice,
      maxGroupSize,
      minRating,
    };
  }

  private mapToDayOfWeek(jsDay: number): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ] as DayOfWeek[];
    return days[jsDay];
  }

  private mapWorkingHoursForCreate(workingHours?: any[]): any[] {
    if (!workingHours || !Array.isArray(workingHours)) {
      return [];
    }

    return workingHours.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable ?? true,
    }));
  }
}
