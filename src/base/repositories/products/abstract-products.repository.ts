import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { Category, Product, ProductImagesPosition } from '@prisma/client';

export abstract class AbstractProductsRepository {
  abstract updateProduct(product: UpdateProductDto): Promise<Product>;
  abstract updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>,
  ): Promise<void>;
  abstract create(data: CreateProductDto): Promise<Product>;
  abstract addImageToProduct(
    productId: string,
    image: Express.Multer.File,
    position: number,
  ): Promise<string>;
  abstract findAll(supplierId?: string): Promise<Array<Product>>;
  abstract findProductById(id: string): Promise<Product>;
  abstract search(
    name?: string,
    category?: Category,
    rating?: number,
    productsLimit?: number,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<Array<Product>>;
  abstract getHowManyFiles(id: string): Promise<Array<ProductImagesPosition>>;
  abstract deleteProduct(id: string): Promise<null>;
  abstract deleteAllImagesBySupplierId(supplierId: string): Promise<boolean>;
  abstract removeImage(productId: string, imageId: string): Promise<void>;
}
