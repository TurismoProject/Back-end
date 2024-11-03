import { BucketService } from '@database/bucket/bucket.service';
import { Injectable, PipeTransform } from '@nestjs/common';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

@Injectable()
export class FilesToURLPipe
  implements PipeTransform<Array<Express.Multer.File>, Promise<Array<string>>>
{
  constructor(private bucketService: BucketService) {}
  async transform(value: Array<Express.Multer.File>) {
    console.log(value);
    const urls = [];
    for (const file of value) {
      const bucket = this.bucketService.getBucket();
      const dateTime = new Date().getTime();
      const fileName = `${dateTime}_${file.originalname}`;
      const fileRef = ref(bucket, fileName);
      const metadata = {
        contentType: file.mimetype,
      };

      const result = await uploadBytesResumable(fileRef, file.buffer, metadata);
      const url = await getDownloadURL(result.ref);
      urls.push(url);
    }

    return urls;
  }
}
