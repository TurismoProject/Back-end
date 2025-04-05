import { BucketService } from '@database/bucket/bucket.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileService {
  constructor(private readonly bucketService: BucketService) {}

  async uploadFile(file: Express.Multer.File, bucket: string) {
    const client = this.bucketService.getClient();

    const dateTime = new Date().getTime();
    const fileName = `${dateTime}_${file.originalname}`;
    const metadata = {
      'Content-Type': file.mimetype,
    };

    await client.putObject(bucket, fileName, file.buffer, file.size, metadata);

    return fileName;
  }

  async deleteFile(fileName: string, bucket: string) {
    const client = this.bucketService.getClient();
    const fileExists = await client.statObject(bucket, fileName);
    if (!fileExists) {
      return false;
    }
    await client.removeObject(bucket, fileName);
    return true;
  }
}
