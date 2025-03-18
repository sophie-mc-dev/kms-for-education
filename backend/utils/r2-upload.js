const AWS = require("aws-sdk");
const r2Config = require("../config/r2-config");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({
  accessKeyId: r2Config.accessKeyId,
  secretAccessKey: r2Config.secretAccessKey,
  endpoint: r2Config.endpoint,
  signatureVersion: "v4",
  region: "auto",
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
    await s3.upload(params).promise();
    return `https://${process.env.R2_PUB}.r2.dev/${objectKey}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    if (error.code === "CredentialsError") {
      console.error("R2 Credentials Error: Check your access keys.");
    } else if (error.code === "NoSuchBucket") {
      console.error("R2 Bucket Not Found: Check your bucket name.");
    }
    throw error;
  }
}

module.exports = { uploadToR2 };
