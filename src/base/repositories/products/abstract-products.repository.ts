import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { Category, Product, WorkingHours } from '@prisma/client';

export abstract class AbstractProductsRepository {
  abstract updateProduct(product: UpdateProductDto): Promise<Product>;
  abstract updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>
  ): Promise<void>;
  abstract create(
    data: CreateProductDto
  ): Promise<
    { workingHours: Omit<Omit<WorkingHours, 'id'>, 'productId'>[] } & Product
  >;
  abstract addImageToProduct(
    productId: string,
    image: Express.Multer.File,
    position: number
  ): Promise<string>;
  abstract findAll(supplierId?: string): Promise<Array<Product>>;
  abstract findProductById(id: string): Promise<Product>;
  abstract search(
    productsLimit?: number,
    name?: string,
    category?: Category,
    minRating?: number,
    minPrice?: number,
    maxPrice?: number,
    maxGroupSize?: number,
    b2bOnly?: boolean
  ): Promise<Array<Product>>;
  abstract getHowManyFiles(id: string): Promise<Array<string>>;
  abstract deleteProduct(id: string): Promise<null>;
  abstract deleteAllImagesBySupplierId(supplierId: string): Promise<boolean>;
  abstract removeImage(productId: string, imageId: string): Promise<void>;
  abstract checkAvailability(
    productId: string,
    startDate: Date,
    endDate: Date,
    guestCount: number
  ): Promise<boolean>;

  abstract getFilters(): Promise<{
    categories: Category[];
    maxPrice: number;
    minPrice: number;
    maxGroupSize: number;
    minRating: number;
  }>;
}
