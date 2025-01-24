import { S3 } from "@aws-sdk/client-s3";
import { lookup } from "mime-types";

import { v4 as uuid } from "uuid";

export const s3Client = new S3({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET_NAME!;
const CDN_ENDPOINT = process.env.DO_SPACES_CDN_ENDPOINT!;

export const uploadToSpaces = async (
  upload: any, // Single file
  folder: string, // Dynamic folder name
  url: string | null | undefined
): Promise<string> => {
  const createReadStream = await upload.file.createReadStream;
  const stream = createReadStream();
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const mimeType = lookup(upload.file.filename) || "application/octet-stream";

  let key: string;
  if (url) {
    const extractKey = (url: string): string => {
      return url.replace(`${CDN_ENDPOINT}/`, "");
    };
    key = extractKey(url); // Use the existing key if URL is provided

    try {
      await s3Client.deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      });
    } catch (error) {
      console.log(error);
    }
  }

  const uniqueFileName = uuid(); // Generate UUID for new file name
  const fileExtension = upload.file.filename.split(".").pop(); // Get file extension
  key = `${folder}/${uniqueFileName}.${fileExtension}`; // Create file path with folder and extension

  // key = `${folder}/${uniqueFileName}`; // Create file path with folder

  try {
    await s3Client.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ACL: "public-read", // Make the file publicly accessible
      ContentType: mimeType, // Set proper content type)
    });

    // Return the CDN URL
    return `${CDN_ENDPOINT}/${key}`;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error}`);
  }
};

export const deleteFromSpaces = async (url: string): Promise<void> => {
  const extractKey = (url: string): string => {
    // Remove the CDN endpoint to get the key
    return url.replace(`${CDN_ENDPOINT}/`, "");
  };

  const key = extractKey(url);

  try {
    await s3Client.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key,
    });
  } catch (error) {
    console.log(error);
  }
};

// // Configure Cloudinary with environment variables
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export default cloudinary;

// export const uploadToCloudinary = async (
//   upload: any, // Single file
//   folder: string // Dynamic folder name
// ): Promise<string> => {
//   const createReadStream = await upload[0].file.createReadStream;

//   const uniqueFileName = uuid(); // Generate UUID for the file name

//   return new Promise<string>((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder,
//         public_id: uniqueFileName, // Use UUID for file name
//         resource_type: "image", // Specify image resource type
//       },
//       (error, result) => {
//         if (error) {
//           reject(error);
//         } else if (result) {
//           resolve(result.secure_url); // Return Cloudinary URL if result is defined
//         } else {
//           reject(new Error("Upload failed with no result returned")); // Handle undefined result
//         }
//       }
//     );

//     createReadStream().pipe(stream); // Upload file to Cloudinary
//   });
// };

// export const deleteFromCloudinary = async (
//   urls: string | string[] // Accept a single URL or an array of URLs
// ): Promise<void | void[]> => {
//   // Normalize URLs to an array for consistent handling
//   const urlArray = Array.isArray(urls) ? urls : [urls];

//   const extractPublicId = (url: string): string => {
//     const parts = url.split("/");
//     const publicIdWithExtension = parts[parts.length - 1]; // Get the file name with extension
//     return publicIdWithExtension.split(".")[0]; // Remove the file extension
//   };

//   // Extract Cloudinary public IDs from URLs
//   const publicIds = urlArray.map((url) => extractPublicId(url));

//   // Delete all files using Promise.all
//   await Promise.all(
//     publicIds.map(async (publicId) => {
//       return new Promise<void>((resolve, reject) => {
//         cloudinary.uploader.destroy(
//           publicId,
//           { resource_type: "image" },
//           (error, result) => {
//             if (error) {
//               reject(error); // Handle error
//             } else if (result.result === "ok") {
//               resolve(); // Resolve promise if deletion is successful
//             } else {
//               reject(new Error("Failed to delete image")); // Handle failure
//             }
//           }
//         );
//       });
//     })
//   );
// };
