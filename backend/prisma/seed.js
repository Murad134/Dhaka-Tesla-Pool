const { PrismaClient, Role, RideStatus, PaymentMethod } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const zones = [
  ["Banani", 23.7937, 90.4066],
  ["Gulshan 1", 23.7806, 90.4147],
  ["Mohakhali", 23.7772, 90.3994],
  ["Dhanmondi", 23.7461, 90.3742],
  ["Mirpur", 23.8223, 90.3654],
  ["Uttara", 23.8759, 90.3795],
  ["Farmgate", 23.7577, 90.3897],
  ["Bashundhara", 23.8223, 90.4250]
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const [name, latitude, longitude] of zones) {
    await prisma.zone.upsert({
      where: { name },
      update: { latitude, longitude },
      create: { name, latitude, longitude }
    });
  }

  const jashim = await prisma.user.upsert({
    where: { email: "jashim@example.com" },
    update: {},
    create: {
      name: "Jashim",
      email: "jashim@example.com",
      passwordHash,
      role: Role.DRIVER
    }
  });

  const bulletDriver = await prisma.driver.upsert({
    where: { userId: jashim.id },
    update: { isOnline: true },
    create: { userId: jashim.id, isOnline: true }
  });

  await prisma.tesla.upsert({
    where: { driverId: bulletDriver.id },
    update: { name: "Bullet", capacity: 3 },
    create: { driverId: bulletDriver.id, name: "Bullet", capacity: 3 }
  });

  for (const [name, email] of [
    ["Nusrat", "nusrat@example.com"],
    ["Rafiq", "rafiq@example.com"],
    ["Shirin", "shirin@example.com"]
  ]) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash,
        role: Role.PASSENGER
      }
    });
  }

  console.log("Seed complete.");
  console.log("Demo password for all users: Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
