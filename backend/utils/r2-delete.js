const AWS = require("aws-sdk");
const r2Config = require("../config/r2-config");

const s3 = new AWS.S3({
  accessKeyId: r2Config.accessKeyId,
  secretAccessKey: r2Config.secretAccessKey,
  endpoint: r2Config.endpoint,
  signatureVersion: "v4",
  region: "auto",
});

/**
 * Deletes a file from R2 storage.
 * @param {string} objectKey - The key (path) of the file in R2.
 * @returns {Promise<void>}
 */
async function deleteFromR2(objectKey) {
  const params = {
    Bucket: r2Config.bucketName,
    Key: objectKey, 
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Deleted ${objectKey} from R2 successfully.`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting from R2:", error);
    if (error.code === "NoSuchKey") {
      console.error("File not found in R2. It may have already been deleted.");
    } else if (error.code === "NoSuchBucket") {
      console.error("R2 Bucket Not Found: Check your bucket name.");
    }
    throw error;
  }
}

module.exports = { deleteFromR2 };
