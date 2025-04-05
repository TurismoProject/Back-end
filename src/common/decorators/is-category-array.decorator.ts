import { registerDecorator } from 'class-validator';
import { Category } from '@prisma/client';

export function IsCategoryArray() {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isCategoryArray',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Categories must be valid',
      },
      validator: {
        validate(value: any[]) {
          try {
            return value.every((category) => Category[category]);
          } catch (e) {
            return false;
          }
        },
      },
    });
  };
}
