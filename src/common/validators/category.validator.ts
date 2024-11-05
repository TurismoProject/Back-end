import { PipeTransform } from '@nestjs/common';
import { Category } from '@prisma/client';

export class CategoryValidatorPipe implements PipeTransform {
  transform(value: string) {
    if (!Category[value]) {
      return;
    }
    return value;
  }
}
