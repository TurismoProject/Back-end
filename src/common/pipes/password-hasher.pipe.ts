import { Injectable, PipeTransform } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHasherPipe<T extends { password: string }>
  implements PipeTransform
{
  async transform(value: T) {
    const salt = await bcrypt.genSalt();
    value.password = await bcrypt.hash(value.password, salt);

    return value;
  }
}
