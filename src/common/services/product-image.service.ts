import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { FileService } from '@services/file.service';

@Injectable()
export class ProductImageService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService
  ) {}

  /**
   * Adds an image to a product
   * @param productId The ID of the product
   * @param image The image file to upload
   * @returns The URL of the uploaded image
   */
  async addImageToProduct(
    productId: string,
    image: Express.Multer.File
  ): Promise<string> {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

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

  /**
   * Updates the position of images in a product
   * @param productId The ID of the product
   * @param imagesPositionsArray The new order of images
   */
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

  /**
   * Removes an image from a product
   * @param productId The ID of the product
   * @param image The URL of the image to remove
   */
  async removeImage(productId: string, image: string): Promise<void> {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
      include: {
        reviews: true,
        availability: true,
        workingHours: true,
      },
    });

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

  /**
   * Deletes all images for a supplier's products
   * @param supplierId The ID of the supplier
   * @returns True if successful, false otherwise
   */
  async deleteAllImagesBySupplierId(supplierId: string): Promise<boolean> {
    const products = await this.prismaService.product.findMany({
      where: {
        supplierId,
      },
    });

    try {
      products.map(async (product) => {
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
}
