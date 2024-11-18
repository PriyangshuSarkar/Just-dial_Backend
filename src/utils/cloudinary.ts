import { v2 as cloudinary } from "cloudinary";
import { FileUpload } from "graphql-upload/Upload";
import { v4 as uuid } from "uuid";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const uploadToCloudinary = async (
  file: FileUpload, // Single file
  folder: string // Dynamic folder name
): Promise<string> => {
  const { createReadStream } = await file;

  const uniqueFileName = uuid(); // Generate UUID for the file name

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: uniqueFileName, // Use UUID for file name
        resource_type: "image", // Specify image resource type
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url); // Return Cloudinary URL if result is defined
        } else {
          reject(new Error("Upload failed with no result returned")); // Handle undefined result
        }
      }
    );

    createReadStream().pipe(stream); // Upload file to Cloudinary
  });
};

export const deleteFromCloudinary = async (
  urls: string | string[] // Accept a single URL or an array of URLs
): Promise<void | void[]> => {
  // Normalize URLs to an array for consistent handling
  const urlArray = Array.isArray(urls) ? urls : [urls];

  const extractPublicId = (url: string): string => {
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1]; // Get the file name with extension
    return publicIdWithExtension.split(".")[0]; // Remove the file extension
  };

  // Extract Cloudinary public IDs from URLs
  const publicIds = urlArray.map((url) => extractPublicId(url));

  // Delete all files using Promise.all
  await Promise.all(
    publicIds.map(async (publicId) => {
      return new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          { resource_type: "image" },
          (error, result) => {
            if (error) {
              reject(error); // Handle error
            } else if (result.result === "ok") {
              resolve(); // Resolve promise if deletion is successful
            } else {
              reject(new Error("Failed to delete image")); // Handle failure
            }
          }
        );
      });
    })
  );
};
