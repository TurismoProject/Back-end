import { AbstractProductsRepository } from './abstract-products.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product, Category, DayOfWeek, WorkingHours } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { FileService } from '@services/file.service';
import { v4 as uuidv4 } from 'uuid';
import { removeProperty } from '@utils/utils';

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
  ) {}

  async updateProduct(product: UpdateProductDto): Promise<Product> {
    try {
      const updatedProduct = await this.prismaService.product.update({
        where: { id: product.id },
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
            create:
              product.workingHours?.map((schedule) => ({
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                isAvailable: schedule.isAvailable ?? true,
              })) || [],
          },
        },
        include: {
          workingHours: true,
        },
      });
      return updatedProduct;
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
  }

  async updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>
  ): Promise<void> {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update the images array in the product with the new order
    await this.prismaService.product.update({
      where: { id: productId },
      data: {
        images: imagesPositionsArray,
      },
    });
  }

  async create(data: CreateProductDto): Promise<
    {
      workingHours: Omit<Omit<WorkingHours, 'id'>, 'productId'>[];
    } & Product
  > {
    const {
      description,
      name,
      price,
      supplierId,
      categories,
      maxGroupSize,
      b2bAvailable,
      b2bMinQuantity,
      b2bDiscount,
      bulkAvailability,
      cancellationPolicy,
      endingPoint,
      meetingPoint,
      minAge,
      languages,
      excludedItems,
      includedItems,
      duration,
      itinerary,
      workingHours,
    } = data;

    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const id = uuidv4();

    const product = await this.prismaService.product.create({
      data: {
        id,
        description,
        name,
        price,
        supplier: {
          connect: {
            id: supplierId,
          },
        },
        categories,
        duration,
        maxGroupSize: maxGroupSize || 1,
        cancellationPolicy,
        endingPoint,
        meetingPoint,
        minAge,
        languages,
        excludedItems,
        includedItems,
        itinerary,
        b2bAvailable: b2bAvailable || false,
        b2bMinQuantity,
        b2bDiscount,
        bulkAvailability: bulkAvailability || 0,
        workingHours: {
          create:
            workingHours?.map((schedule) => ({
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isAvailable: schedule.isAvailable ?? true,
            })) || [],
        },
      },
      include: {
        workingHours: true,
      },
    });

    removeProperty(product.workingHours, 'id');
    removeProperty(product.workingHours, 'productId');

    return product;
  }

  async addImageToProduct(
    productId: string,
    image: Express.Multer.File
  ): Promise<string> {
    const product = await this.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const fileName = await this.fileService.uploadFile(
      image,
      process.env.PUBLIC_BUCKET_NAME,
      `products/${product.id}`
    );
    const currentImages = product.images || [];

    const endpoint =
      process.env.MINIO_ENDPOINT === 'localhost'
        ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`
        : process.env.MINIO_ENDPOINT;

    const imageUrl = `${endpoint}/${process.env.PUBLIC_BUCKET_NAME}/products/${product.id}/${fileName}`;
    await this.prismaService.product.update({
      where: { id: productId },
      data: {
        images: [...currentImages, imageUrl],
      },
    });

    return imageUrl;
  }

  async findAll(supplierId: string = undefined): Promise<Array<Product>> {
    const products = await this.prismaService.product.findMany({
      where: {
        supplierId,
      },
    });

    return products;
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        reviews: true,
        availability: true,
        workingHours: true,
      },
    });

    return product;
  }

  async search(
    productsLimit: number = 20,
    name?: string,
    category?: Category,
    minRating?: number,
    minPrice?: number,
    maxPrice?: number,
    maxGroupSize?: number,
    b2bOnly?: boolean
  ): Promise<Array<Product>> {
    const products = await this.prismaService.product.findMany({
      where: {
        ...(name && {
          name: {
            contains: name,
            mode: 'insensitive',
          },
        }),
        ...(category && {
          categories: {
            has: category,
          },
        }),
        ...(minRating && {
          rating: {
            gte: minRating,
          },
        }),
        ...((minPrice || maxPrice) && {
          price: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        }),
        ...(maxGroupSize && {
          maxGroupSize: {
            gte: maxGroupSize,
          },
        }),
        ...(b2bOnly && { b2bAvailable: true }),
      },
      take: productsLimit,
      include: {
        workingHours: true,
        reviews: true,
        availability: true,
      },
    });

    return products;
  }

  async getHowManyFiles(id: string): Promise<Array<string>> {
    const files = (
      await this.prismaService.product.findUnique({
        where: {
          id: id,
        },
      })
    ).images;

    return files;
  }

  async deleteProduct(id: string): Promise<null> {
    const product = await this.findProductById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.images.map(async (image) => {
      // Get the filename from the URL
      const fileName = image.split('/').pop();

      // Remove the image from MinIO
      await this.fileService.deleteFile(
        process.env.PUBLIC_BUCKET_NAME,
        `products/${product.id}/${fileName}`
      );
    });

    await this.prismaService.product.delete({ where: { id } });

    return;
  }

  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    const allProducts = await this.findAll(supplierId);
    try {
      allProducts.map(async (product) => {
        product.images.map(async (image) => {
          // Get the filename from the URL
          const fileName = image.split('/').pop();

          // Remove the image from MinIO
          await this.fileService.deleteFile(
            process.env.PUBLIC_BUCKET_NAME,
            `products/${product.id}/${fileName}`
          );
        });
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  async removeImage(productId: string, image: string): Promise<void> {
    const product = await this.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get the filename from the URL
    const fileName = image.split('/').pop();

    // Remove the image from MinIO
    await this.fileService.deleteFile(
      process.env.PUBLIC_BUCKET_NAME,
      `products/${product.id}/${fileName}`
    );

    // Remove the image URL from the product's images array
    const updatedImages = product.images.filter((img) => img !== image);

    // Update the product with the new images array
    await this.prismaService.product.update({
      where: { id: productId },
      data: {
        images: updatedImages,
      },
    });
  }

  async checkAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    guestCount: number
  ): Promise<boolean> {
    const product = await this.prismaService.product.findUnique({
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

    if (!product) throw new NotFoundException('Product not found');
    if (guestCount > product.maxGroupSize) return false;

    // Check if all dates in range are available
    const unavailableDates = product.availability.filter((a) => a.isBooked);
    if (unavailableDates.length > 0) return false;

    // Check if the requested time falls within working hours
    const requestedDayOfWeek = startDate.getDay();
    const workingHoursForDay = product.workingHours.find(
      (wh) => wh.dayOfWeek === this.#mapToDayOfWeek(requestedDayOfWeek)
    );

    if (!workingHoursForDay || !workingHoursForDay.isAvailable) return false;

    const requestedTime = startDate.toTimeString().slice(0, 5);
    return (
      requestedTime >= workingHoursForDay.startTime &&
      requestedTime <= workingHoursForDay.endTime
    );
  }

  async getFilters(): Promise<{
    categories: Category[];
    maxPrice: number;
    minPrice: number;
    maxGroupSize: number;
    minRating: number;
  }> {
    const products = await this.prismaService.product.findMany({
      include: {
        reviews: true,
      },
    });

    // Get unique categories from all products
    const categories = [
      ...new Set(products.flatMap((product) => product.categories)),
    ];

    // Get price range
    const prices = products.map((product) => product.price.toNumber());
    const maxPrice = Math.max(...prices, 0);
    const minPrice = Math.min(...prices, 0);

    // Get max group size
    const maxGroupSize = Math.max(
      ...products.map((product) => product.maxGroupSize),
      0
    );

    // Get minimum rating
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

  #mapToDayOfWeek(jsDay: number): DayOfWeek {
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
}
