import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { Product } from '@prisma/client';

export abstract class AbstractProductsRepository {
  abstract create(
<<<<<<< Updated upstream
    product: CreateProductDto,
    urls: Array<string>
  ): Promise<Product>;
  abstract findAll(): Promise<Array<Product>>;
  abstract findProductById(id: string): Promise<Product>;
  abstract update(product: UpdateProductDto): Promise<Product>;
=======
    data: CreateProductDto,
  ): Promise<
    Product & { workingHours: Omit<Omit<WorkingHours, 'id'>, 'productId'>[] }
  >;
  abstract override findAll: never;
  abstract findById(id: string): Promise<Product>;
  abstract update(id: string, product: UpdateProductDto): Promise<Product>;
  abstract delete(id: string): Promise<null>;

  abstract findAllSupplierProducts(): Promise<Array<Product>>;

  // Image management
  abstract addImageToProduct(
    productId: string,
    image: Express.Multer.File,
  ): Promise<string>;
  abstract removeImage(productId: string, imageId: string): Promise<void>;
  abstract updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>,
  ): Promise<void>;
>>>>>>> Stashed changes
  abstract deleteAllImagesBySupplierId(supplierId: string): Promise<boolean>;
  abstract delete(id: string): Promise<null>;
}
