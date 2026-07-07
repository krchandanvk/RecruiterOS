import { PrismaClient } from "../generated/client/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getDb = () => {
  // Use dev.db in the project root to match prisma.config.ts resolution
  const absoluteDbPath = path.join(process.cwd(), "dev.db");
  const dbUri = `file:${absoluteDbPath}`;
  const adapter = new PrismaBetterSqlite3({ url: dbUri });
  return new PrismaClient({ adapter });
};

export const db = globalForPrisma.prisma ?? getDb();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export default db;
export * from "../generated/client/client";
export type * from "../generated/client/client";
