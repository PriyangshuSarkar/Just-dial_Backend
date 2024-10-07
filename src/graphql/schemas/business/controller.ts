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
  AddOrUpdateServiceInput,
  AddOrUpdateServiceSchema,
} from "./db";
import { prisma } from "../../../utils/dbConnect";
import { hashPassword, verifyPassword } from "../../../utils/password";
import { sendEmail } from "../../../utils/emailService";
import { sign } from "jsonwebtoken";
import { verifyToken } from "../../../utils/verifyToken";
import { uploadToCloudinary } from "../../../utils/cloudinary";

export const businessSignup = async (_: unknown, args: BusinessSignupInput) => {
  // Validate input
  const validatedData = BusinessSignupSchema.parse(args);
  const existingBusiness = await prisma.business.findFirst({
    where: { email: validatedData.email, isVerified: true, deletedAt: null },
  });

  if (existingBusiness) {
    throw new Error("Business already exists and email is verified!");
  }

  const otp = (parseInt(randomBytes(3).toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0");
  const { salt, hash } = hashPassword(validatedData.password);

  const newBusiness = await prisma.business.upsert({
    where: { email: validatedData.email },
    update: {
      name: validatedData.name,
      password: hash,
      salt,
      deletedAt: null,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    create: {
      name: validatedData.name,
      email: validatedData.email,
      password: hash,
      salt,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const sendOtpEmail = async (
    businessName: string,
    email: string,
    otp: string
  ): Promise<void> => {
    const emailSubject = "Confirm Your Email Address";
    const emailText = `Hello ${businessName},\n\nThank you for signing up! Please confirm your email address by entering the following OTP:\n\n${otp}\n\nBest regards,\nYour Company Name`;
    await sendEmail(email, emailSubject, emailText);
  };

  await sendOtpEmail(newBusiness.name, newBusiness.email, otp);

  return {
    ...newBusiness,
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
      email: business.email,
    },
    data: {
      isVerified: true,
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
    where: { email: validatedData.email, isVerified: true, deletedAt: null },
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
    where: { email: validatedData.email, isVerified: true, deletedAt: null }, // Find the business by email
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
      isVerified: true,
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
    where: { email: business.email, isVerified: true, deletedAt: null },
    data: {
      password: hash,
      salt: salt,
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

  if (!owner || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isVerified: true, deletedAt: null },
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

  let addressId: string | undefined = undefined;

  // Handle address if provided
  if (validatedData.address) {
    // Same logic as before for handling address (upserting street, city, state, country, pincode)
    const address = await handleAddress(
      validatedData.address,
      business.id,
      "business"
    );
    addressId = address.id;
  }

  // Update business details
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id, isVerified: true, deletedAt: null },
    data: {
      website: validatedData.website || business.website,
      name: validatedData.name || business.name,
      phone: validatedData.phone || business.phone,
      type: validatedData.type || business.type,
      address: addressId ? { connect: { id: addressId } } : undefined,
      companyLogo: logoUrl || business.companyLogo, // Store logo URL
      companyImages: imagesUrls
        ? [...(business.companyImages || []), ...imagesUrls]
        : business.companyImages,
    },
    include: { address: true }, // Include updated address in response if needed
  });

  return {
    ...updatedBusiness,
    message: "Business details updated successfully.",
  };
};

export const addOrUpdateService = async (
  _: unknown,
  args: AddOrUpdateServiceInput
) => {
  // Validate input using Zod or your validation library
  const validatedData = AddOrUpdateServiceSchema.parse(args);

  const owner: any = verifyToken(validatedData.token);

  if (!owner || typeof owner.userId !== "string") {
    throw new Error("Invalid or missing token");
  }

  // Find the business by ID
  const business = await prisma.business.findUnique({
    where: { id: owner.businessId, isVerified: true, deletedAt: null },
    include: { address: true },
  });

  if (!business) {
    throw new Error("Business not found!");
  }

  // Check if the service exists
  const existingService = await prisma.service.findFirst({
    where: {
      id: validatedData.serviceId,
      businessId: validatedData.businessId,
      deletedAt: null,
    },
    include: { address: true },
  });

  // Upload images if provided
  let imagesUrls: string[] | undefined;
  if (validatedData.serviceImages) {
    imagesUrls = (await uploadToCloudinary(
      validatedData.serviceImages,
      "service_images"
    )) as string[];
  }

  let addressId: string | undefined = undefined;

  // Handle address if provided
  if (validatedData.address) {
    // Same logic as before for handling address (upserting street, city, state, country, pincode)
    const address = await handleAddress(
      validatedData.address,
      existingService ? existingService.id : null,
      "service"
    );
    addressId = address.id;
  }

  // Handle tags: connect or create
  const tagConnectOrCreate = await Promise.all(
    validatedData.tags?.map(async (tagName) => {
      return { where: { name: tagName }, create: { name: tagName } };
    }) || []
  );

  // Handle facilities: connect or create
  const facilityConnectOrCreate = await Promise.all(
    validatedData.facilities?.map(async (facilityName) => {
      return {
        where: { name: facilityName },
        create: { name: facilityName },
      };
    }) || []
  );

  // If service exists, update it
  if (existingService) {
    const updatedService = await prisma.service.update({
      where: { id: existingService.id },
      data: {
        name: validatedData.name || existingService.name,
        overview: validatedData.overview || existingService.overview,
        price: validatedData.price || existingService.price,
        discountedPrice:
          validatedData.discountedPrice || existingService.discountedPrice,
        address: addressId ? { connect: { id: addressId } } : undefined, // Update address if provided
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
        facilities: {
          connectOrCreate: facilityConnectOrCreate,
        },
        serviceImages: imagesUrls
          ? [...(existingService?.serviceImages || []), ...imagesUrls]
          : existingService?.serviceImages,
      },
      include: {
        address: true,
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
  }

  // If service does not exist, create a new one
  const newService = await prisma.service.create({
    data: {
      name: validatedData.name,
      overview: validatedData.overview,
      price: validatedData.price,
      discountedPrice: validatedData.discountedPrice,
      business: { connect: { id: validatedData.businessId } },
      subcategory: { connect: { id: validatedData.subcategoryId } },
      address: addressId ? { connect: { id: addressId } } : undefined,
      tags: {
        connectOrCreate: tagConnectOrCreate,
      },
      facilities: {
        connectOrCreate: facilityConnectOrCreate,
      },
      serviceImages: imagesUrls || [],
    },
    include: {
      address: true,
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

const handleAddress = async (
  addressData: any,
  entityId: string | null,
  entityType: "business" | "service" | "user"
) => {
  // Upsert street
  const street = await prisma.street.upsert({
    where: { name: addressData.street },
    update: {},
    create: { name: addressData.street },
  });

  // Upsert city
  const city = await prisma.city.upsert({
    where: { name: addressData.city },
    update: {},
    create: { name: addressData.city },
  });

  // Upsert state
  const state = await prisma.state.upsert({
    where: { name: addressData.state },
    update: {},
    create: { name: addressData.state },
  });

  // Upsert country
  const country = await prisma.country.upsert({
    where: { name: addressData.country },
    update: {},
    create: { name: addressData.country },
  });

  // Upsert pincode
  const pincode = await prisma.pincode.upsert({
    where: { name: addressData.pincode },
    update: {},
    create: { name: addressData.pincode },
  });

  // Dynamic logic to handle address based on the entity type (business, service, or user)
  let whereClause;
  let createData;

  if (entityType === "business") {
    whereClause = { businessId: entityId || undefined };
    createData = { businessId: entityId };
  } else if (entityType === "service") {
    whereClause = { serviceId: entityId || undefined };
    createData = { serviceId: entityId };
  } else if (entityType === "user") {
    whereClause = { userId: entityId || undefined };
    createData = { userId: entityId };
  } else {
    throw new Error("Invalid entity type provided");
  }

  // Upsert or create address using entityId (businessId, serviceId, or userId)
  const address = await prisma.address.upsert({
    where: whereClause,
    update: {
      street: { connect: { id: street.id } },
      city: { connect: { id: city.id } },
      state: { connect: { id: state.id } },
      country: { connect: { id: country.id } },
      pincode: { connect: { id: pincode.id } },
    },
    create: {
      ...createData,
      street: { connect: { id: street.id } },
      city: { connect: { id: city.id } },
      state: { connect: { id: state.id } },
      country: { connect: { id: country.id } },
      pincode: { connect: { id: pincode.id } },
    },
  });

  return address;
};
