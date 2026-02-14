import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["error"],
    });
  }
  prisma = global.prisma;
}

// Connexion eagerly pour éviter le cold start Neon
prisma.$connect().catch((e) => {
  console.error("Prisma connect error:", e);
});

export default prisma;