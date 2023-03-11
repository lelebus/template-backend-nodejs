import { uploadPublic } from "../integrations/aws.s3.service";
import { aws_s3 } from "../../config";

export async function uploadImage(itemId: string, file: any): Promise<string> {
  if (file == null) {
    return "";
  }

  const { createReadStream, mimetype } = await file;
  return uploadPublic(aws_s3.bucketName, mimetype, itemId, createReadStream());
}
