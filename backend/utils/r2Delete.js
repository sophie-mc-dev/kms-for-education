const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const r2Config = require('../config/r2-config');

const s3 = new S3Client({
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
  endpoint: r2Config.endpoint,
  region: 'auto',
});

async function deleteFromR2(objectKey) {
  const params = {
    Bucket: r2Config.bucketName,
    Key: objectKey,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    console.log(`Deleted ${objectKey} from R2 successfully.`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting from R2:", error);
    if (error.name === "NoSuchKey") {
      console.error("File not found in R2. It may have already been deleted.");
    } else if (error.name === "NoSuchBucket") {
      console.error("R2 Bucket Not Found: Check your bucket name.");
    }
    throw error;
  }
}

module.exports = { deleteFromR2 };
