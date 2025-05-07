import { BucketService } from '@database/bucket/bucket.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  constructor(private readonly bucketService: BucketService) {}

  async uploadFile(file: Express.Multer.File, bucket: string, folder: string) {
    const client = this.bucketService.getClient();

    const dateTime = new Date().getTime();
    const fileName = `${dateTime}_${file.originalname}`;
    const metadata = {
      'Content-Type': file.mimetype,
    };

    await client.putObject(
      bucket,
      `${folder}/${fileName}`,
      file.buffer,
      file.size,
      metadata
    );

    return fileName;
  }

  async deleteFile(bucket: string, fileName: string) {
    const client = this.bucketService.getClient();
    try {
      await client.statObject(bucket, fileName);
      await client.removeObject(bucket, fileName);
      return true;
    } catch (error) {
      return false;
    }
  }
}
