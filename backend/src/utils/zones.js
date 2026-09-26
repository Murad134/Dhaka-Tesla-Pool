const CORRIDORS = [
  ["Banani", "Mohakhali"],
  ["Banani", "Gulshan 1"],
  ["Gulshan 1", "Banani"],
  ["Mohakhali", "Banani"],
  ["Banani", "Farmgate"],
  ["Farmgate", "Dhanmondi"],
  ["Dhanmondi", "Farmgate"],
  ["Gulshan 1", "Bashundhara"],
  ["Bashundhara", "Gulshan 1"],
  ["Mohakhali", "Farmgate"],
  ["Farmgate", "Mohakhali"],
  ["Uttara", "Mohakhali"],
  ["Mohakhali", "Uttara"]
];

const corridorSet = new Set(CORRIDORS.map(([a, b]) => `${a}|${b}`));

function isCompatibleRoute(aPickup, aDestination, bPickup, bDestination) {
  if (aPickup === bPickup) return true;
  return corridorSet.has(`${aPickup}|${aDestination}`) &&
    corridorSet.has(`${bPickup}|${bDestination}`) &&
    (
      aDestination === bDestination ||
      aDestination === bPickup ||
      bDestination === aPickup
    );
}

module.exports = { CORRIDORS, isCompatibleRoute };
