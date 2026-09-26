describe("ownership rule", () => {
  test("a ride belongs to its passenger or assigned driver only", () => {
    const ride = { passengerId: "user-a", driverUserId: "driver-a" };
    const canTouch = (userId) =>
      userId === ride.passengerId || userId === ride.driverUserId;

    expect(canTouch("user-a")).toBe(true);
    expect(canTouch("driver-a")).toBe(true);
    expect(canTouch("user-b")).toBe(false);
  });
});
