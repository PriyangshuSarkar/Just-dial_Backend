import { randomBytes } from "crypto";
import {
  ChangeBusinessPasswordInput,
  ChangeBusinessPasswordSchema,
  ForgetBusinessPasswordInput,
  ForgetBusinessPasswordSchema,
  BusinessLoginInput,
  BusinessLoginSchema,
  BusinessSignupInput,
  BusinessSignupSchema,
  VerifyBusinessEmailInput,
  VerifyBusinessEmailSchema,
  UpdateBusinessDetailsInput,
  UpdateBusinessDetailsSchema,
  AddServiceInput,
  AddServiceSchema,
  UpdateServiceInput,
  UpdateServiceSchema,
  RemoveServiceInput,
  RemoveServiceSchema,
  BusinessMeInput,
  BusinessMeSchema,
  VerifyBusinessPhoneInput,
  VerifyBusinessPhoneSchema,
  AddBusinessPhoneSchema,
  AddBusinessPhoneInput,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail, sendOtpEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import { verifyToken } from "../../../utils/verifyToken";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../../utils/cloudinary";
import { v4 } from "uuid";
import slugify from "slugify";
import { sendOtpPhone } from "../../../utils/smsService";

export const businessMe = async (_: unknown, args: BusinessMeInput) => {
  const validatedData = BusinessMeSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findFirst({
    where: { id: owner.id, isEmailVerified: true, deletedAt: null },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: {
        include: {
          address: {
            include: {
              street: true,
              city: true,
              state: true,
              country: true,
              pincode: true,
            },
          },
          subcategory: {
            include: {
              category: true,
            },
          },
          tags: true,
          facilities: true,
        },
      },
      reviews: true,
      subscription: true,
    },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  return {
    ...business,
  };
};

export const businessSignup = async (_: unknown, args: BusinessSignupInput) => {
  // Validate input
  const validatedData = BusinessSignupSchema.parse(args);
  const existingBusiness = await prisma.business.findFirst({
    where: {
      email: validatedData.email,
      isEmailVerified: true,
      deletedAt: null,
    },
  });

  if (existingBusiness) {
    throw new Error("Business already exists and email is verified!");
  }

  const baseSlug = slugify(validatedData.name, { lower: true, strict: true });
  const uuid = v4();
  const slug = `${baseSlug}-${uuid}`;

  const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");
  const { salt, hash } = hashPassword(validatedData.password);

  const newBusiness = await prisma.business.upsert({
    where: { email: validatedData.email },
    update: {
      id: uuid,
      name: validatedData.name,
      slug: slug,
      password: hash,
      salt,
      deletedAt: null,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    create: {
      id: uuid,
      name: validatedData.name,
      slug: slug,
      email: validatedData.email,
      password: hash,
      type: validatedData.type,
      salt,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOtpEmail(newBusiness.name, newBusiness.email, otp);

  return {
    email: newBusiness.email,
    message: "Business created! Please verify your email.",
  };
};

export const verifyBusinessEmail = async (
  _: unknown,
  args: VerifyBusinessEmailInput
) => {
  const validatedData = VerifyBusinessEmailSchema.parse(args);

  const business = await prisma.business.findFirst({
    where: {
      email: validatedData.email,
    },
  });

  if (!business) {
    throw new Error("Email doesn't exist!");
  }

  const currentTime = new Date();

  if (business.otpExpiresAt! < currentTime) {
    throw new Error("OTP has expired.");
  }

  if (business.otp! !== validatedData.otp) {
    throw new Error("OTP doesn't match!");
  }

  const validatedBusiness = await prisma.business.update({
    where: {
      id: business.id,
    },
    data: {
      isEmailVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
    include: {
      address: {
        where: { deletedAt: null },
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: true,
    },
  });

  const token = sign(
    { businessId: validatedBusiness.id },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    }
  );

  return {
    ...validatedBusiness,
    message: "Business OTP verified!",
    token: token,
  };
};

export const businessLogin = async (_: unknown, args: BusinessLoginInput) => {
  const validatedData = BusinessLoginSchema.parse(args);

  const business = await prisma.business.findFirst({
    where: {
      email: validatedData.email,
      isEmailVerified: true,
      deletedAt: null,
    },
    include: {
      address: {
        where: { deletedAt: null },
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: true,
    },
  });

  if (!business) {
    throw new Error("Email doesn't exit!");
  }

  const verify = verifyPassword(
    validatedData.password,
    business.salt,
    business.password
  );

  if (verify) {
    const token = sign({ businessId: business.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return {
      ...business,
      message: "Logged in successful.",
      token: token,
    };
  } else {
    throw new Error("Wrong password!");
  }
};

export const addBusinessPhone = async (
  _: unknown,
  args: AddBusinessPhoneInput
) => {
  const validatedData = AddBusinessPhoneSchema.parse(args);

  const existingPhone = await prisma.business.findFirst({
    where: { phone: validatedData.phone },
  });

  if (existingPhone) {
    throw new Error("Phone number already exist!");
  }

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isEmailVerified: true, deletedAt: null },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");

  const updatedBusiness = await prisma.business.update({
    where: { id: business.id, isEmailVerified: true, deletedAt: null },
    data: {
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  await sendOtpPhone(updatedBusiness.name, updatedBusiness.email, otp);

  return {
    ...updatedBusiness,
    message: "Business created! Please verify your email.",
  };
};

export const verifyBusinessPhone = async (
  _: unknown,
  args: VerifyBusinessPhoneInput
) => {
  const validatedData = VerifyBusinessPhoneSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isEmailVerified: true, deletedAt: null },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  const currentTime = new Date();

  if (business.otpExpiresAt! < currentTime) {
    throw new Error("OTP has expired.");
  }

  if (business.otp! !== validatedData.otp) {
    throw new Error("OTP doesn't match!");
  }

  const validatedBusinessPhone = await prisma.business.update({
    where: {
      id: business.id,
    },
    data: {
      phone: validatedData.phone,
      isPhoneVerified: true,
      otp: null,
      otpExpiresAt: null,
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
    },
  });

  return {
    ...validatedBusinessPhone,
    message: "Business Phone OTP verified!",
  };
};

export const forgetBusinessPassword = async (
  _: unknown,
  args: ForgetBusinessPasswordInput
) => {
  const validatedData = ForgetBusinessPasswordSchema.parse(args);

  const sendOtpEmail = async (
    businessName: string,
    email: string,
    otp: string
  ) => {
    const emailSubject = "Password Reset OTP";
    const emailText = `Hello ${businessName},\n\nThe OTP (expires in 10 minutes) to change the password for you account is:\n\n${otp}\n\nBest regards,\nYour Company Name`;

    await sendEmail(email, emailSubject, emailText);
  };

  const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");

  const business = await prisma.business.update({
    where: {
      email: validatedData.email,
      isEmailVerified: true,
      deletedAt: null,
    }, // Find the business by email
    data: {
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOtpEmail(business.name, business.email, otp);

  return {
    message: `The password reset otp is sent at ${business.email}`,
  };
};

export const changeBusinessPassword = async (
  _: unknown,
  args: ChangeBusinessPasswordInput
) => {
  const validatedData = ChangeBusinessPasswordSchema.parse(args);

  const business = await prisma.business.findFirst({
    where: {
      email: validatedData.email,
      isEmailVerified: true,
      deletedAt: null,
    },
  });
  if (!business) {
    throw new Error("Email doesn't exit!");
  }

  const currentTime = new Date();

  if (business.otpExpiresAt! < currentTime) {
    throw new Error("OTP has expired.");
  }

  if (business.otp! !== validatedData.otp) {
    throw new Error("OTP doesn't match!");
  }

  const verify = verifyPassword(
    validatedData.password,
    business.salt,
    business.password
  );

  if (verify) {
    throw new Error("Password can't me same as last password.");
  }

  const { salt, hash } = hashPassword(validatedData.password);

  const updatedPassword = await prisma.business.update({
    where: { email: business.email, isEmailVerified: true, deletedAt: null },
    data: {
      password: hash,
      salt: salt,
    },
    include: {
      address: {
        where: { deletedAt: null },
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: true,
    },
  });

  return {
    ...updatedPassword,
    massage: "Password updated successfully.",
  };
};

export const updateBusinessDetails = async (
  _: unknown,
  args: UpdateBusinessDetailsInput
) => {
  const validatedData = UpdateBusinessDetailsSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isEmailVerified: true, deletedAt: null },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  // Upload logo if provided
  let logoUrl: string | undefined;
  if (validatedData.companyLogo) {
    logoUrl = (await uploadToCloudinary(
      validatedData.companyLogo,
      "business_logos"
    )) as string;
  }

  // Upload images if provided
  let imagesUrls: string[] | undefined;
  if (validatedData.companyImages) {
    imagesUrls = (await uploadToCloudinary(
      validatedData.companyImages,
      "business_images"
    )) as string[];
  }

  // Handle image deletion if any images are marked for deletion
  if (
    validatedData.companyImagesToDelete &&
    validatedData.companyImagesToDelete.length > 0
  ) {
    const companyImagesToDelete = validatedData.companyImagesToDelete;
    const remainingImages = business.companyImages?.filter(
      (imgUrl: string) => !companyImagesToDelete.includes(imgUrl)
    );

    // Delete images from Cloudinary
    for (const imageUrl of companyImagesToDelete) {
      await deleteFromCloudinary(imageUrl); // Implement this function
    }

    business.companyImages = remainingImages; // Update the company's image list
  }

  // Update business details
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id, isEmailVerified: true, deletedAt: null },
    data: {
      website: validatedData.website || business.website,
      name: validatedData.name || business.name,
      type: validatedData.type || business.type,
      companyLogo: logoUrl || business.companyLogo, // Store logo URL
      companyImages: imagesUrls
        ? [...(business.companyImages || []), ...imagesUrls]
        : business.companyImages,
    },
    include: {
      address: {
        where: { deletedAt: null },
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      services: true,
    },
  });

  return {
    ...updatedBusiness,
    message: "Business details updated successfully.",
  };
};

export const addService = async (_: unknown, args: AddServiceInput) => {
  // Validate input
  const validatedData = AddServiceSchema.parse(args);

  // Token validation
  const owner: any = verifyToken(validatedData.token);
  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Check if the business exists
  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isEmailVerified: true, deletedAt: null },
  });
  if (!business) {
    throw new Error("Business not found!");
  }

  // Upload images if provided
  let imagesUrls: string[] | undefined;
  if (validatedData.serviceImages) {
    imagesUrls = (await uploadToCloudinary(
      validatedData.serviceImages,
      "service_images"
    )) as string[];
  }

  // Handle tags: check if the tag exists, if not, create it
  const tagConnectOrCreate =
    validatedData.tags?.map((tag) => ({
      where: { name: tag }, // Condition to find the existing tag
      create: { name: tag }, // Create new tag if it doesn't exist
    })) || [];

  // Handle facilities: check if the facility exists, if not, create it
  const facilityConnectOrCreate =
    validatedData.facilities?.map((facility) => ({
      where: { name: facility }, // Condition to find the existing facility
      create: { name: facility }, // Create new facility if it doesn't exist
    })) || [];

  const baseSlug = slugify(validatedData.name, { lower: true, strict: true });
  const uuid = v4();
  const slug = `${baseSlug}-${uuid}`;

  // Create the service
  const newService = await prisma.service.create({
    data: {
      id: uuid,
      name: validatedData.name,
      slug: slug,
      overview: validatedData.overview,
      price: validatedData.price,
      discountedPrice: validatedData.discountedPrice,
      business: { connect: { id: business.id } },
      subcategory: { connect: { id: validatedData.subcategoryId } },
      tags: {
        connectOrCreate: tagConnectOrCreate,
      },
      facilities: {
        connectOrCreate: facilityConnectOrCreate,
      },
      serviceImages: imagesUrls || [],
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      tags: true,
      facilities: true,
    },
  });

  return {
    ...newService,
    message: "Service added successfully.",
  };
};

export const updateService = async (_: unknown, args: UpdateServiceInput) => {
  const validatedData = UpdateServiceSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);
  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: validatedData.serviceId,
      businessId: owner.id,
      deletedAt: null,
    },
  });
  if (!service) {
    throw new Error("Service not found!");
  }

  // Handle tags: check if the tag exists, if not, create it
  const tagConnectOrCreate =
    validatedData.tags?.map((tag) => ({
      where: { name: tag }, // Condition to find the existing tag
      create: { name: tag }, // Create new tag if it doesn't exist
    })) || [];

  // Handle facilities: check if the facility exists, if not, create it
  const facilityConnectOrCreate =
    validatedData.facilities?.map((facility) => ({
      where: { name: facility }, // Condition to find the existing facility
      create: { name: facility }, // Create new facility if it doesn't exist
    })) || [];

  // Upload new images
  let imagesUrls: string[] | undefined;
  if (validatedData.serviceImages) {
    imagesUrls = (await uploadToCloudinary(
      validatedData.serviceImages,
      "service_images"
    )) as string[];
  }

  // Handle image deletions
  if (validatedData.serviceImagesToDelete) {
    const remainingImages = service.serviceImages?.filter((img) =>
      validatedData.serviceImagesToDelete?.includes(img)
    );
    for (const img of validatedData.serviceImagesToDelete) {
      await deleteFromCloudinary(img);
    }
    service.serviceImages = remainingImages;
  }

  const baseSlug = slugify(validatedData.name || service.name, {
    lower: true,
    strict: true,
  });
  const uuid = service.id;
  const slug = `${baseSlug}-${uuid}`;

  // Update service data
  const updatedService = await prisma.service.update({
    where: { id: validatedData.serviceId, deletedAt: null },
    data: {
      name: validatedData.name || service.name,
      slug: slug,
      overview: validatedData.overview || service.overview,
      price: validatedData.price || service.price,
      discountedPrice: validatedData.discountedPrice || service.discountedPrice,
      tags: {
        connectOrCreate: tagConnectOrCreate, // Add or update tags
        disconnect:
          validatedData.tagsToDelete?.map((tagId) => ({ id: tagId })) || [], // Handle deletions
      },
      facilities: {
        connectOrCreate: facilityConnectOrCreate, // Add or update facilities
        disconnect:
          validatedData.facilitiesToDelete?.map((facilityId) => ({
            id: facilityId,
          })) || [], // Handle deletions
      },
      serviceImages: imagesUrls
        ? [...(service.serviceImages || []), ...imagesUrls]
        : service.serviceImages,
    },
    include: {
      address: {
        include: {
          street: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      tags: true,
      facilities: true,
    },
  });

  return {
    ...updatedService,
    message: "Service updated successfully.",
  };
};

export const removeService = async (_: unknown, args: RemoveServiceInput) => {
  const validatedData = RemoveServiceSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);
  if (!owner || typeof owner.businessId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: validatedData.serviceId,
      businessId: owner.id,
      deletedAt: null,
    },
  });
  if (!service) {
    throw new Error("Service not found!");
  }

  // Soft delete the service by marking it as deleted
  const removedService = await prisma.service.update({
    where: { id: validatedData.serviceId },
    data: { deletedAt: new Date() },
  });

  return {
    ...removedService,
    message: "Service removed successfully.",
  };
};
