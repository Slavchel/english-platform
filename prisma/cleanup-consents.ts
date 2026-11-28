import { prisma } from "../lib/prisma";

async function main() {
  const now = new Date();
  const result = await prisma.userConsent.deleteMany({
    where: { retainUntil: { lte: now } },
  });

  console.log(`[consent] Deleted expired consent records: ${result.count}`);
}

main()
  .catch((error) => {
    console.error("[consent] Cleanup failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
