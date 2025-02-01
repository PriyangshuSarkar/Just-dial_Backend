/* eslint-disable */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const indianStatesAndUTs = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const countries = ["India"];

const courtTypes = [
  "Civil Court",
  "Criminal Court",
  "High Court",
  "Consumer Court",
  "District Court",
  "Family Court",
  "Labour Court",
  "Session Court",
  "Magistrate Court",
  "Supreme Court",
  "Bombay High Court",
  "Chandigarh High Court",
];

const legalServices = [
  "Corporate Law",
  "Intellectual Property (IP) Law",
  "Employment and Labor Law",
  "Real Estate Law",
  "Family Law",
  "Criminal Defense",
  "Immigration Law",
  "Tax Law",
  "Personal Injury Law",
  "Estate Planning and Probate",
  "Bankruptcy Law",
  "Environmental Law",
  "Contract Law",
  "Medical Malpractice",
  "Consumer Protection Law",
  "Civil Rights Law",
  "Entertainment Law",
  "Construction Law",
  "Insurance Law",
  "International Law",
  "Cybersecurity and Data Privacy",
  "Litigation and Dispute Resolution",
  "Mergers and Acquisitions",
  "Alternative Dispute Resolution (ADR)",
  "Education Law",
  "Administrative Law",
  "Elder Law",
  "Social Security Disability Law",
  "Antitrust and Competition Law",
  "Human Rights Law",
  "Maritime and Admiralty Law",
  "Healthcare Law",
  "Securities Law",
  "Agricultural Law",
  "Telecommunications Law",
  "Transportation Law",
  "Gaming Law",
];

const languageProficiencyIndia = [
  "Hindi",
  "English",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Urdu",
  "Gujarati",
  "Malayalam",
  "Kannada",
  "Odia",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Sanskrit",
  "Kashmiri",
  "Nepali",
  "Sindhi",
  "Dogri",
  "Manipuri",
  "Bodo",
  "Santhali",
  "Konkani",
  "Rajasthani",
  "Haryanvi",
  "Mizo",
  "Tulu",
  "Khasi",
  "Sikkimese",
];

async function main() {
  // Create Categories
  const legalCategory = await prisma.category.create({
    data: {
      name: "Legal",
      slug: "legal",
    },
  });

  const ITCategory = await prisma.category.create({
    data: {
      name: "Information Technology",
      slug: "information-technology",
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

  // Create Businesses and Business Details
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
      businessDetails: {
        create: {
          registrationNumber: "REG123456",
          license: "LIC123456",
          experience: 10,
          teamSize: 50,
          description:
            "A leading legal firm providing comprehensive legal services.",
          latitude: 28.6448,
          longitude: 77.2167,
          degrees: ["LLB", "LLM"],
          gstNumber: "27AACCT0618J1ZI",
          categories: {
            connect: [{ id: legalCategory.id }],
          },
          addresses: {
            create: {
              street: "123, Legal Lane",
              city: delhiCity.name,
              country: india.name,
              pincode: "110001",
              state: delhiState.name,
            },
          },
          operatingHours: {
            create: {
              dayOfWeek: "MONDAY",
              openingTime: "09:00",
              closingTime: "18:00",
            },
          },
        },
      },
      primaryContacts: {
        create: {
          type: "EMAIL",
          value: "contact@legalservicesinc.com",
          isVerified: true,
          isPrimary: true,
        },
      },
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
      businessDetails: {
        create: {
          registrationNumber: "REG654321",
          license: "LIC654321",
          experience: 5,
          teamSize: 25,
          description: "A technology firm specializing in software solutions.",
          latitude: 19.076,
          longitude: 72.8777,
          degrees: ["B.Tech", "M.Tech"],
          gstNumber: "27AABCC0618J2ZI",
          categories: {
            connect: [{ id: ITCategory.id }],
          },
          addresses: {
            create: {
              street: "456, Tech Road",
              city: mumbaiCity.name,
              country: india.name,
              pincode: "400001",
              state: mumbaiState.name,
            },
          },
          operatingHours: {
            create: {
              dayOfWeek: "MONDAY",
              openingTime: "10:00",
              closingTime: "19:00",
            },
          },
        },
      },
      primaryContacts: {
        create: {
          type: "EMAIL",
          value: "contact@techsolutionspvtltd.com",
          isVerified: true,
          isPrimary: true,
        },
      },
    },
  });

  // Seed States and UTs
  for (const state of indianStatesAndUTs) {
    await prisma.state.create({
      data: {
        name: state,
        slug: state.toLowerCase().replace(/ /g, "-"),
        country: { connect: { id: india.id } },
      },
    });
  }

  // Seed Court Types
  for (const courtType of courtTypes) {
    await prisma.court.create({
      data: {
        name: courtType,
        slug: courtType.toLowerCase().replace(/ /g, "-"),
      },
    });
  }

  // Seed Legal Services
  for (const service of legalServices) {
    await prisma.category.create({
      data: { name: service, slug: service.toLowerCase().replace(/ /g, "-") },
    });
  }

  // Seed Languages
  for (const language of languageProficiencyIndia) {
    await prisma.language.create({
      data: { name: language, slug: language.toLowerCase().replace(/ /g, "-") },
    });
  }

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
