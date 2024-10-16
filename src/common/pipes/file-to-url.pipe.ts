import { BucketService } from '@database/bucket/bucket.service';
import { Injectable, PipeTransform } from '@nestjs/common';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

@Injectable()
export class FileToURLPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  constructor(private bucketService: BucketService) {}
  async transform(value: Express.Multer.File) {
    const bucket = this.bucketService.getBucket();
    const dateTime = new Date().getTime();
    const fileName = `${dateTime}_${value.originalname}`;
    const fileRef = ref(bucket, fileName);
    const metadata = {
      contentType: value.mimetype,
    };

    const result = await uploadBytesResumable(fileRef, value.buffer, metadata);
    const url = await getDownloadURL(result.ref);
    return url;
  }
}
