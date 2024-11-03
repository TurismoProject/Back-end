import { CreateProductDto } from '@dtos/create-product.dto';
import { UpdateProductDto } from '@dtos/update-product.dto';
import { Product } from '@prisma/client';

export abstract class AbstractProductsRepository {
  abstract create(
    product: CreateProductDto,
    urls: Array<string>
  ): Promise<Product>;
  abstract findAll(): Promise<Array<Product>>;
  abstract findProductById(id: string): Promise<Product>;
  abstract update(product: UpdateProductDto): Promise<Product>;
  abstract deleteAllImagesBySupplierId(supplierId: string): Promise<boolean>;
  abstract delete(id: string): Promise<null>;
}
