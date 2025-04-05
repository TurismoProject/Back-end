import { AbstractProductsRepository } from './abstract-products.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { Product, Category, ProductImagesPosition } from '@prisma/client';
import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { FileService } from '@services/file.service';
import { v4 as uuidv4 } from 'uuid';
import { BucketService } from '@database/bucket/bucket.service';

@Injectable()
export class ProductsRepository implements AbstractProductsRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly bucketService: BucketService
  ) {}

  async updateProduct(product: UpdateProductDto): Promise<Product> {
    try {
      const updatedProduct = await this.prismaService.product.update({
        where: { id: product.id },
        data: {
          description: product.description,
          name: product.name,
          price: product.price,
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
  ) {
    const imageDbObjects =
      await this.prismaService.productImagesPosition.findMany({
        where: { productId: productId },
      });

    for (let i = 0; i < imageDbObjects.length; i++) {
      const image = imageDbObjects.find(
        (image) => image.imageName === imagesPositionsArray[i]
      );
      await this.prismaService.productImagesPosition.update({
        where: { id: image.imageName },
        data: { position: i },
      });
    }
  }

  async create(data: CreateProductDto) {
    const { description, name, price, supplierId, categories } = data;
    const supplier = await this.prismaService.supplier.findUnique({
      where: { id: supplierId },
    });
    const id = uuidv4();
    const bucketName = `${name.replace(/\s/g, '-').toLowerCase()}-files-${id}`;
    await this.bucketService.createBucket(bucketName);

    const product = {
      id,
      description,
      name,
      price,
      bucketName,
      supplierId: supplier.id,
      categories,
    };

    const createdProduct = await this.prismaService.product.create({
      data: product,
    });

    return createdProduct;
  }

  async addImageToProduct(
    productId: string,
    image: Express.Multer.File,
    position: number
  ): Promise<string> {
    const product = await this.findProductById(productId);
    const fileName = await this.fileService.uploadFile(
      image,
      product.bucketName
    );
    await this.prismaService.productImagesPosition.create({
      data: {
        productId: productId,
        position,
        imageName: fileName,
      },
    });

    return fileName;
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
    });
    return product;
  }

  async search(
    name?: string,
    category?: Category,
    rating?: number,
    productsLimit?: number,
    minPrice?: number,
    maxPrice?: number
  ): Promise<Array<Product>> {
    if (category) {
      const products = await this.prismaService.product.findMany({
        where: {
          name: {
            contains: name,
          },
          categories: {
            has: category,
          },
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
          rating: {
            gte: rating,
          },
        },
        take: productsLimit,
      });

      return products;
    }

    const products = await this.prismaService.product.findMany({
      where: {
        name: {
          contains: name,
        },
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
        rating: {
          gte: rating,
        },
      },
      take: productsLimit,
    });

    return products;
  }

  async getHowManyFiles(id: string): Promise<Array<ProductImagesPosition>> {
    const files = await this.prismaService.productImagesPosition.findMany({
      where: { productId: id },
    });

    return files;
  }

  async deleteProduct(id: string): Promise<null> {
    const product = await this.findProductById(id);
    await this.bucketService.deleteBucket(product.bucketName);
    await this.prismaService.product.delete({ where: { id } });

    return;
  }

  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    const allProducts = await this.findAll(supplierId);
    try {
      allProducts.map(async (product) => {
        await this.bucketService.deleteBucket(product.bucketName);
      });

      return true;
    } catch (e) {
      return false;
    }
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const bucketName = await this.#getBucket(productId);
    const imageDbObjects =
      await this.prismaService.productImagesPosition.findMany({
        where: {
          productId: productId,
        },
      });

    const imageObject = imageDbObjects.find(
      (imageObject) => imageObject.id === imageId
    );
    for (let i = imageObject.position + 1; i <= imageDbObjects.length; i++) {
      const image = imageDbObjects.find((image) => image.position === i);
      await this.prismaService.productImagesPosition.update({
        where: { id: image.id },
        data: { position: i - 1 },
      });
    }

    await this.fileService.deleteFile(bucketName, imageObject.imageName);

    await this.prismaService.productImagesPosition.delete({
      where: { id: imageId },
    });
    return;
  }

  async #getBucket(productId: string): Promise<string> {
    const product = await this.findProductById(productId);
    return product.bucketName;
  }
}
