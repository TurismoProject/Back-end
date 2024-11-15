import {
  BadRequestException,
  Injectable,
  mixin,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { FileService } from '@services/file.service';

interface FilesToURLPipeOptions {
  fileOptional: boolean;
}

export function FilesToURLPipe(
  options: FilesToURLPipeOptions = { fileOptional: false },
): Type<PipeTransform> {
  @Injectable()
  class MixinFilesToURLPipe
    implements
      PipeTransform<Array<Express.Multer.File>, Promise<Array<string>>>
  {
    constructor(private fileService: FileService) {}
    async transform(value: Array<Express.Multer.File>) {
      if (!value && options.fileOptional) return [];

      if (!value) throw new BadRequestException('Files are required');

      const urls = [];
      for (const file of value) {
        const url = await this.fileService.uploadFile(file);
        urls.push(url);
      }

      return urls;
    }
  }

  return mixin(MixinFilesToURLPipe);
}
