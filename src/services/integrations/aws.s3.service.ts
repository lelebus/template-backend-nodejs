import AWS from "aws-sdk";
import { aws_s3 } from "../../config";

import logger from "../../utils/logger";

const server = new AWS.S3({
  accessKeyId: aws_s3.accessKeyId,
  secretAccessKey: aws_s3.secretAccessKey,
});

export async function uploadPublic(
  bucketName: string,
  mimetype: string,
  fileName: string,
  fileContent: Body
): Promise<string> {
  let params = {
    Bucket: bucketName,
    ACL: "public-read",
    ContentType: mimetype,
    Key: `${fileName
      .replace(/\s+/g, "")
      .toLowerCase()}-${new Date().getTime()}`,
    Body: fileContent,
  };

  return server
    .upload(params)
    .promise()
    .then((res) => {
      logger.info(
        { name: fileName, url: res.Location },
        "aws-s3 => Uploaded public file"
      );
      return res.Location;
    });
}
