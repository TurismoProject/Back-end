import { Produto } from '@prisma/client';

export abstract class AbstractProductsRepository {
  abstract create(product: any): Promise<Produto>;
  abstract findAll(): Promise<Array<Produto>>;
  abstract findProductById(id: number): Promise<Produto>;
  abstract update(product: any): Promise<Produto>;
  abstract delete(id: number): Promise<null>;
}
