import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isArray } from 'class-validator';

export class FileTypeValidatorPipe implements PipeTransform {
  transform(value?: Array<Express.Multer.File> | Express.Multer.File) {
    if (!value) return value;

    if (isArray(value)) {
      const filesIdxs = [];
      value.map((file, idx) => {
        if (!this.validFileType(file)) {
          filesIdxs.push(idx);
        }
      });

      if (filesIdxs.length > 0) {
        throw new BadRequestException(
          `Files ${filesIdxs.join(', ')} are not an image or video supported`,
        );
      }
      return value;
    }

    if (!this.validFileType(value)) {
      throw new BadRequestException('File is not an image or video supported');
    }
    return value;
  }

  private validFileType(file: Express.Multer.File) {
    const pngMagicNumbers = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const jpegMagicNumbers = new Uint8Array([0xff, 0xd8, 0xff]);
    const mp4MagicNumbers = new Uint8Array([0x66, 0x74, 0x79, 0x70]);
    const webmMagicNumbers = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
    const aviMagicNumbers = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

    switch (file.mimetype) {
      case 'image/png':
        if (pngMagicNumbers.every((byte, idx) => byte === file.buffer[idx]))
          return true;
        break;
      case 'image/jpeg':
        if (jpegMagicNumbers.every((byte, idx) => byte === file.buffer[idx]))
          return true;
        break;
      case 'video/mp4':
        if (mp4MagicNumbers.every((byte, idx) => byte === file.buffer[idx]))
          return true;
        break;
      case 'video/webm':
        if (webmMagicNumbers.every((byte, idx) => byte === file.buffer[idx]))
          return true;
        break;
      case 'video/avi':
        if (aviMagicNumbers.every((byte, idx) => byte === file.buffer[idx]))
          return true;
        break;
      default:
        throw new BadRequestException('Invalid File Type');
    }
  }
}
