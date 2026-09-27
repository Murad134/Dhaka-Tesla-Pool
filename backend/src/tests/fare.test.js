const { calculateFare } = require("../utils/fareCalculator");

describe("fare calculator", () => {
  test("calculates a non-pooled fare", () => {
    expect(calculateFare({ distanceKm: 5, isPooled: false }).farePoysha).toBe(20000);
  });

  test("applies 20% pool discount", () => {
    const result = calculateFare({ distanceKm: 5, isPooled: true });
    expect(result.farePoysha).toBe(16000);
    expect(result.poolDiscountPoysha).toBe(4000);
  });
});
