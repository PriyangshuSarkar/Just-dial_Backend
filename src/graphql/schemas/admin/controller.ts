import { prisma } from "../../../utils/dbConnect";
import {
  AdminLoginInput,
  AdminLoginSchema,
  AllBusinessesInput,
  AllBusinessesSchema,
  AllUserInput,
  AllUsersSchema,
  BlockBusinessesInput,
  BlockBusinessesSchema,
  BlockUserInput,
  BlockUserSchema,
  VerifyBusinessesInput,
  VerifyBusinessesSchema,
} from "./db";
import { sign } from "jsonwebtoken";

export const adminLogin = async (_: unknown, args: AdminLoginInput) => {
  const validatedData = AdminLoginSchema.parse(args);

  const admin = await prisma.admin.findFirst({
    where: { email: validatedData.email },
  });

  if (!admin) {
    throw new Error("Email doesn't exit!");
  }

  if (admin.password === validatedData.password) {
    const token = sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRATION_TIME!,
    });

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      message: "Logged in successful.",
      token: token,
    };
  } else {
    throw new Error("Wrong password!");
  }
};

export const allUsers = async (_: unknown, args: AllUserInput) => {
  const validatedData = AllUsersSchema.parse(args);

  const skip = (validatedData.page - 1) * validatedData.limit;

  const where: any = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.contacts = {
      some: {
        OR: [
          validatedData.email && {
            type: "EMAIL",
            value: { contains: validatedData.email, mode: "insensitive" },
          },
          validatedData.phone && {
            type: "PHONE",
            value: { contains: validatedData.phone },
          },
        ].filter(Boolean),
      },
    };
  }
  if (validatedData.hasSubscription !== undefined) {
    where.subscriptionId = validatedData.hasSubscription ? { not: null } : null;
  }

  if (validatedData.subscriptionId) {
    where.subscriptionId = validatedData.subscriptionId;
  }

  if (validatedData.createdAtStart || validatedData.createdAtEnd) {
    where.createdAt = {
      ...(validatedData.createdAtStart && {
        gte: new Date(validatedData.createdAtStart),
      }),
      ...(validatedData.createdAtEnd && {
        lte: new Date(validatedData.createdAtEnd),
      }),
    };
  }

  // Execute query
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        contacts: true,
        subscription: true,
        addresses: true,
      },
      skip,
      take: validatedData.limit,
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    ...users,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const allBusinesses = async (_: unknown, args: AllBusinessesInput) => {
  const validatedData = AllBusinessesSchema.parse(args);

  const skip = (validatedData.page - 1) * validatedData.limit;

  const where: any = {};

  if (validatedData.name) {
    where.name = { contains: validatedData.name, mode: "insensitive" };
  }

  if (validatedData.email || validatedData.phone) {
    where.primaryContacts = {
      some: {
        OR: [
          validatedData.email && {
            type: "EMAIL",
            value: { contains: validatedData.email, mode: "insensitive" },
            deletedAt: null,
          },
          validatedData.phone && {
            type: "PHONE",
            value: { contains: validatedData.phone },
            deletedAt: null,
          },
        ].filter(Boolean),
      },
    };
  }

  if (validatedData.type) {
    where.type = validatedData.type;
  }

  if (validatedData.isBusinessVerified !== undefined) {
    where.isBusinessVerified = validatedData.isBusinessVerified;
  }

  if (validatedData.isListed !== undefined) {
    where.isListed = validatedData.isListed;
  }

  if (validatedData.hasSubscription !== undefined) {
    where.subscriptionId = validatedData.hasSubscription ? { not: null } : null;
  }

  if (validatedData.subscriptionId) {
    where.subscriptionId = validatedData.subscriptionId;
  }

  if (validatedData.categoryId) {
    where.businessDetails = {
      categoryId: validatedData.categoryId,
    };
  }

  if (validatedData.averageRatingMin || validatedData.averageRatingMax) {
    where.averageRating = {
      ...(validatedData.averageRatingMin !== undefined && {
        gte: validatedData.averageRatingMin,
      }),
      ...(validatedData.averageRatingMax !== undefined && {
        lte: validatedData.averageRatingMax,
      }),
    };
  }

  if (validatedData.createdAtStart || validatedData.createdAtEnd) {
    where.createdAt = {
      ...(validatedData.createdAtStart && {
        gte: new Date(validatedData.createdAtStart),
      }),
      ...(validatedData.createdAtEnd && {
        lte: new Date(validatedData.createdAtEnd),
      }),
    };
  }

  // Execute query
  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        primaryContacts: true,
        subscription: true,
        businessDetails: {
          include: {
            addresses: true,
            category: true,
            tags: true,
            images: true,
            websites: true,
          },
        },
      },
      skip,
      take: validatedData.limit,
      orderBy: {
        [validatedData.sortBy]: validatedData.sortOrder,
      },
    }),
    prisma.business.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedData.limit);

  return {
    ...businesses,
    total,
    page: validatedData.page,
    limit: validatedData.limit,
    totalPages,
  };
};

export const blockUsers = async (_: unknown, args: BlockUserInput) => {
  const { userIds } = BlockUserSchema.parse(args);

  const blockedUsers = await prisma.user.updateMany({
    where: {
      id: {
        in: userIds,
      },
    },
    data: {
      isBlocked: true,
    },
  });

  return {
    ...blockedUsers,
  };
};

export const blockBusinesses = async (
  _: unknown,
  args: BlockBusinessesInput
) => {
  const { businessIds } = BlockBusinessesSchema.parse(args);

  const blockedBusinesses = await prisma.business.updateMany({
    where: {
      id: {
        in: businessIds,
      },
    },
    data: {
      isBlocked: true,
    },
  });

  return {
    ...blockedBusinesses,
  };
};

export const verifyBusinesses = async (
  _: unknown,
  args: VerifyBusinessesInput
) => {
  const validatedData = VerifyBusinessesSchema.parse(args);

  const verifiedBusinesses = await prisma.business.updateMany({
    where: {
      id: { in: validatedData.businessIds },
    },
    data: {
      isBusinessVerified: true,
    },
  });

  return {
    ...verifiedBusinesses,
  };
};
