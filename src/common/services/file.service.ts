import { BucketService } from '@database/bucket/bucket.service';
import { Injectable } from '@nestjs/common';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
} from 'firebase/storage';

@Injectable()
export class FileService {
  constructor(private readonly bucketService: BucketService) {}

  async uploadFile(file: Express.Multer.File) {
    const bucket = this.bucketService.getBucket();
    const dateTime = new Date().getTime();
    const fileName = `${dateTime}_${file.originalname}`;
    const fileRef = ref(bucket, fileName);
    const metadata = {
      contentType: file.mimetype,
    };

    const result = await uploadBytesResumable(fileRef, file.buffer, metadata);
    return await getDownloadURL(result.ref);
  }

  async deleteFile(url: string) {
    const bucket = this.bucketService.getBucket();
    const fileName = url.split('/')[7].split('?')[0];
    const fileRef = ref(bucket, fileName);

    return await deleteObject(fileRef);
  }

  async fileExistsOnBucket(url: string) {
    const bucket = this.bucketService.getBucket();
    const fileName = url.split('/')[7].split('?')[0];
    const fileRef = ref(bucket, fileName);
    try {
      const fileUrl = await getDownloadURL(fileRef);
      return fileUrl === url;
    } catch (e) {
      return false;
    }
  }
}
