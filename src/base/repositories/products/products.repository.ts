import { Injectable, NotFoundException } from '@nestjs/common';
import { AbstractProductsRepository } from './abstract-products.repository';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
<<<<<<< Updated upstream
import { FileService } from '@services/file.service';
=======
import { v4 as uuidv4 } from 'uuid';
import { removePropertyForEach } from '@utils/utils';
import { ProductImageService } from '@services/product-image.service';
import { SearchProductDto } from '@dtos/search-product.dto';
import { AvailabilityParamsDto } from '@dtos/availability-params.dto';
import { ProductFiltersDto } from '@dtos/filter-product.dto';
import { BaseRepository } from '@common/repositories/base.repository';
>>>>>>> Stashed changes

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(
<<<<<<< Updated upstream
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
  ) {}

  async create(data: CreateProductDto, urls: Array<string>): Promise<Product> {
    const { description, name, price, supplierId } = data;
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });

    const product = {
      description,
      name,
      price,
      supplierId: supplier.id,
      imagesUrl: urls,
    };

    const createdProduct = await this.prismaService.product.create({
      data: product,
    });

    return createdProduct;
=======
    protected readonly prismaService: PrismaService,
    private readonly productImageService: ProductImageService,
  ) {
    super(prismaService);
>>>>>>> Stashed changes
  }

  async findAll(supplierId: string = undefined): Promise<Array<Product>> {
    if (!supplierId) {
      const products = await this.prismaService.product.findMany();

      return products;
    }

<<<<<<< Updated upstream
    const products = await this.prismaService.product.findMany({
      where: {
        supplierId,
=======
  async create(
    data: CreateProductDto,
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
>>>>>>> Stashed changes
      },
    });

    return products;
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    return product;
  }

  async update(data: UpdateProductDto): Promise<Product> {
    try {
      const updatedProduct = await this.prismaService.product.update({
        where: { id: data.id },
        data: {
          description: data.description,
          name: data.name,
          price: data.price,
        },
      });

      return updatedProduct;
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
  }

  async delete(id: string): Promise<null> {
    const product = await this.findProductById(id);

    try {
      product.imagesUrl.reduce((acc, url) => {
        this.fileService.deleteFile(url);
        return acc;
      }, []);
    } catch (e) {
      throw new NotFoundException('Product does not exists on database');
    }

    await this.prismaService.product.delete({ where: { id } });

<<<<<<< Updated upstream
    return;
=======
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
    image: Express.Multer.File,
  ): Promise<string> {
    return this.productImageService.addImageToProduct(productId, image);
  }

  async removeImage(productId: string, image: string): Promise<void> {
    return this.productImageService.removeImage(productId, image);
  }

  async updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>,
  ): Promise<void> {
    return this.productImageService.updateProductImagePosition(
      productId,
      imagesPositionsArray,
    );
>>>>>>> Stashed changes
  }

  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    const allProducts = await this.findAll(supplierId);
    try {
      allProducts.map((product) => {
        product.imagesUrl.reduce((acc, url) => {
          this.fileService.deleteFile(url);
          return acc;
        }, []);
      });

      return true;
    } catch (e) {
      return false;
    }
<<<<<<< Updated upstream
=======

    // Check if any dates in the range are already booked
    const hasBookedDates = product.availability.some((date) => date.isBooked);
    if (hasBookedDates) {
      return false;
    }

    // Check if the requested day and time are within working hours
    const dayOfWeek = this.mapToDayOfWeek(startDate.getDay());
    const workingHoursForDay = product.workingHours.find(
      (wh) => wh.dayOfWeek === dayOfWeek && wh.isAvailable,
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
      0,
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
>>>>>>> Stashed changes
  }
}
