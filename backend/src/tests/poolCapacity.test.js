function canAdd(occupied, requested, capacity) {
  return occupied + requested <= capacity;
}

describe("pool capacity", () => {
  test("Bullet capacity of 3 cannot be exceeded", () => {
    expect(canAdd(2, 1, 3)).toBe(true);
    expect(canAdd(3, 1, 3)).toBe(false);
    expect(canAdd(2, 2, 3)).toBe(false);
  });
});
