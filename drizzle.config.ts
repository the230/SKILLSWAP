// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// ✅ Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Please check your .env file.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", // ✅ Update if actual path is different
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
