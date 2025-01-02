/* eslint-disable */

import { search } from "./newSearch/controller";
import { SearchInput } from "./newSearch/db";

async function testSearch() {
  // Test Case 1: Basic search with minimal filters
  const basicSearch: SearchInput = {
    search: "pankaj",
    // page: 1,
    // limit: 10,
  };

  // Test Case 2: Search with location filters
  const locationSearch: SearchInput = {
    search: "legal",
    city: "delhi",
    // state: "Maharashtra",
    // country: "India",
    // page: 1,
    // limit: 10,
  };

  // Test Case 3: Search with all possible filters
  const complexSearch: SearchInput = {
    // "page": null,
    // "limit": null,
    // "verified": null,
    // "minPrice": null,
    // "maxPrice": null,
    // "minRating": 3,
    sortBy: "rating",
    order: "desc",
    // "categoryId": null,
    // categorySlug: "education-law",
    // "languages": null,
    // "courts": null,
    // "proficiencies": null,
    pincode: "100001",
    city: "delhi",
    state: "new delhi",
    country: "india",
    // "search": "p"
  };

  try {
    // console.log("Running basic search test...");
    // const basicResults = await search(null, basicSearch);
    // console.log("Basic search results:", JSON.stringify(basicResults, null, 2));

    // console.log("\nRunning location search test...");
    // const locationResults = await search(null, locationSearch);
    // console.log(
    //   "Location search results:",
    //   JSON.stringify(locationResults, null, 2)
    // );

    console.log("\nRunning complex search test...");
    const complexResults = await search(null, complexSearch);
    const { businesses, categories, ...others } = complexResults;
    console.log(
      "business results:",
      // @ts-expect-error
      businesses?.map((business) => {
        const name = business.name;
        const address = business.businessDetails?.addresses?.[0]; // Assuming we want the first address

        return {
          name,
          address: address
            ? `${address.street}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`
            : "No address available",
        };
      })
    );

    console.log(
      "category results:",
      // @ts-expect-error
      categories?.map((c) => c.name)
    );
    console.log("others:", others);
  } catch (error) {
    console.error("Error during search:", error);
  }
}

testSearch();
