import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const data = {
  id: 2,
  name: "United States of America",
  slug: "united-states",
  states: [
    {
      id: 1,
      name: "Alabama",
      slug: "alabama",
      countryId: 2,
      cities: [
        { id: 1, name: "Birmingham", slug: "birmingham", stateId: 1 },
        { id: 2, name: "Montgomery", slug: "montgomery", stateId: 1 },
      ],
    },
    {
      id: 2,
      name: "Alaska",
      slug: "alaska",
      countryId: 2,
      cities: [
        { id: 3, name: "Anchorage", slug: "anchorage", stateId: 2 },
        { id: 4, name: "Juneau", slug: "juneau", stateId: 2 },
      ],
    },
    {
      id: 3,
      name: "Arizona",
      slug: "arizona",
      countryId: 2,
      cities: [
        { id: 5, name: "Phoenix", slug: "phoenix", stateId: 3 },
        { id: 6, name: "Tucson", slug: "tucson", stateId: 3 },
      ],
    },
    {
      id: 4,
      name: "Arkansas",
      slug: "arkansas",
      countryId: 2,
      cities: [{ id: 7, name: "Little Rock", slug: "little-rock", stateId: 4 }],
    },
    {
      id: 5,
      name: "California",
      slug: "california",
      countryId: 2,
      cities: [
        { id: 8, name: "Los Angeles", slug: "los-angeles", stateId: 5 },
        { id: 9, name: "San Francisco", slug: "san-francisco", stateId: 5 },
        { id: 10, name: "San Diego", slug: "san-diego", stateId: 5 },
      ],
    },
    {
      id: 6,
      name: "Colorado",
      slug: "colorado",
      countryId: 2,
      cities: [
        { id: 11, name: "Denver", slug: "denver", stateId: 6 },
        {
          id: 12,
          name: "Colorado Springs",
          slug: "colorado-springs",
          stateId: 6,
        },
      ],
    },
    {
      id: 7,
      name: "Connecticut",
      slug: "connecticut",
      countryId: 2,
      cities: [
        { id: 13, name: "Hartford", slug: "hartford", stateId: 7 },
        { id: 14, name: "New Haven", slug: "new-haven", stateId: 7 },
      ],
    },
    {
      id: 8,
      name: "Delaware",
      slug: "delaware",
      countryId: 2,
      cities: [{ id: 15, name: "Wilmington", slug: "wilmington", stateId: 8 }],
    },
    {
      id: 9,
      name: "Florida",
      slug: "florida",
      countryId: 2,
      cities: [
        { id: 16, name: "Miami", slug: "miami", stateId: 9 },
        { id: 17, name: "Orlando", slug: "orlando", stateId: 9 },
        { id: 18, name: "Tampa", slug: "tampa", stateId: 9 },
      ],
    },
    {
      id: 10,
      name: "Georgia",
      slug: "georgia",
      countryId: 2,
      cities: [
        { id: 19, name: "Atlanta", slug: "atlanta", stateId: 10 },
        { id: 20, name: "Savannah", slug: "savannah", stateId: 10 },
      ],
    },
    {
      id: 11,
      name: "Hawaii",
      slug: "hawaii",
      countryId: 2,
      cities: [{ id: 21, name: "Honolulu", slug: "honolulu", stateId: 11 }],
    },
    {
      id: 12,
      name: "Illinois",
      slug: "illinois",
      countryId: 2,
      cities: [
        { id: 22, name: "Chicago", slug: "chicago", stateId: 12 },
        { id: 23, name: "Springfield", slug: "springfield", stateId: 12 },
      ],
    },
    {
      id: 13,
      name: "New York",
      slug: "new-york",
      countryId: 2,
      cities: [
        { id: 24, name: "New York City", slug: "new-york-city", stateId: 13 },
        { id: 25, name: "Buffalo", slug: "buffalo", stateId: 13 },
      ],
    },
    {
      id: 14,
      name: "Texas",
      slug: "texas",
      countryId: 2,
      cities: [
        { id: 26, name: "Houston", slug: "houston", stateId: 14 },
        { id: 27, name: "Dallas", slug: "dallas", stateId: 14 },
        { id: 28, name: "Austin", slug: "austin", stateId: 14 },
      ],
    },
    {
      id: 15,
      name: "Washington",
      slug: "washington",
      countryId: 2,
      cities: [
        { id: 29, name: "Seattle", slug: "seattle", stateId: 15 },
        { id: 30, name: "Spokane", slug: "spokane", stateId: 15 },
      ],
    },
    {
      id: 16,
      name: "Washington D.C.",
      slug: "washington-dc",
      countryId: 2,
      cities: [
        { id: 31, name: "Washington D.C.", slug: "washington-dc", stateId: 16 },
      ],
    },
  ],
};

async function main() {
  // Create Categories
  async function insertCountryData(prisma, data) {
    await prisma.country.create({
      data: {
        name: data.name,
        slug: data.slug,
        states: {
          create: data.states.map((state) => ({
            name: state.name,
            slug: state.slug,
            cities: {
              create: state.cities.map((city) => ({
                name: city.name,
                slug: city.slug,
              })),
            },
          })),
        },
      },
    });
  }

  // Insert the data
  await insertCountryData(prisma, data);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
