import { object, string, infer as infer_ } from "zod";
import { prisma } from "./dbConnect";

const addressSchema = object({
  pincode: string().trim().regex(/^\d*$/).optional(),
  city: string().trim().optional(),
  state: string().trim().optional(),
  country: string().trim().optional(),
});

type addressInput = infer_<typeof addressSchema>;

// Reusable upsert function for Country
const upsertCountry = async (country: string) => {
  try {
    const existingCountry = await prisma.country.findFirst({
      where: { name: { contains: country, mode: "insensitive" } },
      select: { id: true },
    });
    if (existingCountry) return existingCountry;
    else {
      return prisma.country.create({
        data: { name: country },
      });
    }
  } catch (error) {
    console.error("Error in upsertCountry:", error);
    throw error;
  }
};

// Reusable upsert function for State
const upsertState = async (countryId: string, state: string) => {
  try {
    const existingState = await prisma.state.findFirst({
      where: { name: { contains: state, mode: "insensitive" }, countryId },
      select: { id: true },
    });
    if (existingState) return existingState;
    else {
      return prisma.state.create({
        data: { name: state, countryId },
      });
    }
  } catch (error) {
    console.error("Error in upsertState:", error);
    throw error;
  }
};

// Reusable upsert function for City
const upsertCity = async (stateId: string, city: string) => {
  try {
    const existingCity = await prisma.city.findFirst({
      where: { name: { contains: city, mode: "insensitive" }, stateId },
      select: { id: true },
    });
    if (existingCity) return existingCity;
    else {
      return prisma.city.create({
        data: { name: city, stateId },
      });
    }
  } catch (error) {
    console.error("Error in upsertCity:", error);
    throw error;
  }
};

// Reusable upsert function for Pincode
const upsertPincode = async (cityId: string, pincode: string) => {
  try {
    const existingPincode = await prisma.pincode.findFirst({
      where: { code: { contains: pincode, mode: "insensitive" }, cityId },
      select: { id: true },
    });
    if (existingPincode) return existingPincode;
    else {
      return prisma.pincode.create({
        data: { code: pincode, cityId },
      });
    }
  } catch (error) {
    console.error("Error in upsertPincode:", error);
    throw error;
  }
};

// Main Address Utility Function
export const addressUtility = async (args: addressInput) => {
  (async () => {
    try {
      const { pincode, city, state, country } = addressSchema.parse(args);

      if (country) {
        const countryData = await upsertCountry(country);
        if (state) {
          const stateData = await upsertState(countryData.id, state);
          if (city) {
            const cityData = await upsertCity(stateData.id, city);
            if (pincode) {
              await upsertPincode(cityData.id, pincode);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing address:", error);
    }
  })();
};
