import { AbstractBaseRepository } from '@commonrepos/abstract-base.repository';
import { AvailabilityParamsDto } from '@dtos/availability-params.dto';
import { CreateProductDto } from '@dtos/create-product.dto';
import { ProductFiltersDto } from '@dtos/filter-product.dto';
import { SearchProductDto } from '@dtos/search-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { Product, WorkingHours } from '@prisma/client';

export abstract class AbstractProductsRepository extends AbstractBaseRepository<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  // Core product operations
  abstract create(
    data: CreateProductDto
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
    image: Express.Multer.File
  ): Promise<string>;
  abstract removeImage(productId: string, imageId: string): Promise<void>;
  abstract updateProductImagePosition(
    productId: string,
    imagesPositionsArray: Array<string>
  ): Promise<void>;
  abstract deleteAllImagesBySupplierId(supplierId: string): Promise<boolean>;

  // Search and availability
  abstract search(params: SearchProductDto): Promise<Array<Product>>;
  abstract checkAvailability(params: AvailabilityParamsDto): Promise<boolean>;
  abstract getFilters(): Promise<ProductFiltersDto>;
}
