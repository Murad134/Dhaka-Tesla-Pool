const { isCompatibleRoute } = require("../src/utils/zones");

describe("corridor matching", () => {
  test("accepts same pickup zone", () => {
    expect(isCompatibleRoute("Banani", "Mohakhali", "Banani", "Gulshan 1")).toBe(true);
  });

  test("rejects unrelated routes", () => {
    expect(isCompatibleRoute("Uttara", "Dhanmondi", "Banani", "Bashundhara")).toBe(false);
  });
});