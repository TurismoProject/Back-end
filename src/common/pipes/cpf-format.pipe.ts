import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class CpfMaskPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (value && value.cpf && typeof value.cpf === 'string') {

            value.cpf = value.cpf.replaceAll('.', '').replace('-', '');
        }
        return value;
    }
}
