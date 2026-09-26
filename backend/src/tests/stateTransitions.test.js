const { isValidTransition } = require("../src/utils/rideStateMachine");

describe("ride state machine", () => {
  test("allows requested to matched", () => {
    expect(isValidTransition("REQUESTED", "MATCHED")).toBe(true);
  });

  test("rejects completed back to started", () => {
    expect(isValidTransition("COMPLETED", "STARTED")).toBe(false);
  });

  test("rejects started to cancelled", () => {
    expect(isValidTransition("STARTED", "CANCELLED")).toBe(false);
  });
});