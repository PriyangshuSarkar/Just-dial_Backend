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

// Function to upload files to Cloudinary
export const uploadToCloudinary = async (
  files: FileUpload | FileUpload[], // Accept a single file or an array of files
  folder: string // Dynamic folder name
): Promise<string | string[]> => {
  // Normalize files to an array for consistent handling
  const fileArray = Array.isArray(files) ? files : [files];

  // Upload all files using Promise.all
  const uploadedUrls = await Promise.all(
    fileArray.map(async (file) => {
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
            if (error) reject(error);
            else if (result) {
              resolve(result.secure_url); // Return Cloudinary URL if result is defined
            } else {
              reject(new Error("Upload failed with no result returned")); // Handle undefined result
            }
          }
        );

        createReadStream().pipe(stream); // Upload file to Cloudinary
      });
    })
  );

  // If only one file was passed, return a string, otherwise return an array
  return fileArray.length === 1 ? uploadedUrls[0] : uploadedUrls;
};
