/* eslint-disable */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Categories
  const legalCategory = await prisma.category.create({
    data: {
      name: "Legal",
      slug: "legal",
      categoryImage: "https://example.com/legal-category-image.jpg",
    },
  });

  const ITCategory = await prisma.category.create({
    data: {
      name: "Information Technology",
      slug: "information-technology",
      categoryImage: "https://example.com/it-category-image.jpg",
    },
  });

  // Create Countries, States, and Cities
  const india = await prisma.country.create({
    data: {
      name: "India",
      slug: "india",
    },
  });

  const delhiState = await prisma.state.create({
    data: {
      name: "Delhi",
      slug: "delhi",
      countryId: india.id,
    },
  });

  const mumbaiState = await prisma.state.create({
    data: {
      name: "Maharashtra",
      slug: "maharashtra",
      countryId: india.id,
    },
  });

  const delhiCity = await prisma.city.create({
    data: {
      name: "New Delhi",
      slug: "new-delhi",
      stateId: delhiState.id,
    },
  });

  const mumbaiCity = await prisma.city.create({
    data: {
      name: "Mumbai",
      slug: "mumbai",
      stateId: mumbaiState.id,
    },
  });

  // Create Businesses
  const business1 = await prisma.business.create({
    data: {
      name: "Legal Services Inc.",
      slug: "legal-services-inc",
      password:
        "2db1983d377397b26e8f307427a8961098afbaccbea0a361dedb6e17bf4d6397388e0c0c41d8a0c6936372a0686a7b3b46887f4e0214bae3c68e63fcb6d5ece9",
      salt: "a34ca5c470f46fe5a3afe840d7a307cc",
      type: "FIRM",
      isBusinessVerified: true,
      isListed: true,
      averageRating: 4.5,
      reviewCount: 10,
      paymentVerification: true,
      razorpay_order_id: "order_1234567890",
      price: 1000,
      //   categoryId: legalCategory.id,
    },
  });

  const business2 = await prisma.business.create({
    data: {
      name: "Tech Solutions Pvt Ltd",
      slug: "tech-solutions-pvt-ltd",
      password:
        "2db1983d377397b26e8f307427a8961098afbaccbea0a361dedb6e17bf4d6397388e0c0c41d8a0c6936372a0686a7b3b46887f4e0214bae3c68e63fcb6d5ece9",
      salt: "a34ca5c470f46fe5a3afe840d7a307cc",
      type: "FIRM",
      isBusinessVerified: true,
      isListed: true,
      averageRating: 4.8,
      reviewCount: 15,
      paymentVerification: true,
      razorpay_order_id: "order_0987654321",
      price: 1500,
      //   categoryId: ITCategory.id,
    },
  });

  // Create Business Details
  const businessDetails1 = await prisma.businessDetails.create({
    data: {
      registrationNumber: "REG123456",
      license: "LIC123456",
      experience: 10,
      teamSize: 50,
      description:
        "A leading legal firm providing comprehensive legal services.",
      latitude: 28.6448,
      longitude: 77.2167,
      degree: ["LLB", "LLM"],
      gstNumber: "27AACCT0618J1ZI",
      categoryId: legalCategory.id,
      logo: "https://example.com/legal-logo.jpg",
      id: business1.id,
    },
  });

  const businessDetails2 = await prisma.businessDetails.create({
    data: {
      registrationNumber: "REG654321",
      license: "LIC654321",
      experience: 5,
      teamSize: 25,
      description: "A technology firm specializing in software solutions.",
      latitude: 19.076,
      longitude: 72.8777,
      degree: ["B.Tech", "M.Tech"],
      gstNumber: "27AABCC0618J2ZI",
      categoryId: ITCategory.id,
      logo: "https://example.com/it-logo.jpg",
      id: business2.id,
    },
  });

  // Create Business Addresses
  const businessAddress1 = await prisma.businessAddress.create({
    data: {
      businessDetailsId: businessDetails1.id,
      street: "123, Legal Lane",
      city: delhiCity.name,
      country: india.name,
      pincode: "110001",
      state: delhiState.name,
    },
  });

  const businessAddress2 = await prisma.businessAddress.create({
    data: {
      businessDetailsId: businessDetails2.id,
      street: "456, Tech Road",
      city: mumbaiCity.name,
      country: india.name,
      pincode: "400001",
      state: mumbaiState.name,
    },
  });

  // Create Business Primary Contacts
  const businessPrimaryContact1 = await prisma.businessPrimaryContact.create({
    data: {
      businessId: business1.id,
      type: "EMAIL",
      value: "contact@legalservicesinc.com",
      isVerified: true,
      isPrimary: true,
    },
  });

  const businessPrimaryContact2 = await prisma.businessPrimaryContact.create({
    data: {
      businessId: business2.id,
      type: "EMAIL",
      value: "contact@techsolutionspvtltd.com",
      isVerified: true,
      isPrimary: true,
    },
  });

  // Create Business Operating Hours
  const businessOperatingHours1 = await prisma.businessOperatingHours.create({
    data: {
      businessDetailsId: businessDetails1.id,
      dayOfWeek: "MONDAY",
      openingTime: "09:00",
      closingTime: "18:00",
    },
  });

  const businessOperatingHours2 = await prisma.businessOperatingHours.create({
    data: {
      businessDetailsId: businessDetails2.id,
      dayOfWeek: "MONDAY",
      openingTime: "10:00",
      closingTime: "19:00",
    },
  });

  console.log("Seed data inserted successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
