const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const r2Config = require('../config/r2-config');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
  endpoint: r2Config.endpoint,
  region: 'auto',
});

async function uploadToR2(file, resourceId) {
  const objectKey = `${resourceId}/${uuidv4()}`;
  const params = {
    Bucket: r2Config.bucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.R2_PUB}.r2.dev/${objectKey}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    if (error.name === "CredentialsProviderError") {
      console.error("R2 Credentials Error: Check your access keys.");
    } else if (error.name === "NoSuchBucket") {
      console.error("R2 Bucket Not Found: Check your bucket name.");
    }
    throw error;
  }
}

module.exports = { uploadToR2 };
