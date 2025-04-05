import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isArray } from 'class-validator';

interface IFileSizeValidatorOptions {
  fileMaxSize: number;
  imageMaxSize?: number;
}

export class FileSizeValidatorPipe implements PipeTransform {
  constructor(private options: IFileSizeValidatorOptions) {}
  transform(value: Array<Express.Multer.File> | Express.Multer.File) {
    if (isArray(value)) {
      const filesIdxs: number[] = [];
      value.map((file, idx) => {
        switch (file.mimetype) {
          case 'image/png':
            if (
              this.options.imageMaxSize &&
              file.size > this.options.imageMaxSize
            )
              filesIdxs.push(idx);
            else if (file.size > this.options.fileMaxSize) filesIdxs.push(idx);
          case 'image/jpeg':
            if (
              this.options.imageMaxSize &&
              file.size > this.options.imageMaxSize
            )
              filesIdxs.push(idx);
            else if (file.size > this.options.fileMaxSize) filesIdxs.push(idx);
          default:
            if (file.size > this.options.fileMaxSize) filesIdxs.push(idx + 1);
        }
      });
      if (filesIdxs.length > 0) {
        throw new BadRequestException(
          `Files ${filesIdxs.join(', ')} are bigger than allowed`,
        );
      }
      return value;
    }

    return value;
  }
}
