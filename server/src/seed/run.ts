import { migrate } from "../lib/db";
import { seedDatabase } from "./seed";

migrate();
seedDatabase();
console.log("Database reset and seeded with demo data.");
