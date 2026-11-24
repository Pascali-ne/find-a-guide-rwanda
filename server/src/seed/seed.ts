import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { db, run, transaction } from "../lib/db";
import { addDays, nowIso, today } from "../lib/dates";
import { docsDir } from "../middleware/upload";
import { recalculateGuideRating } from "../lib/ratings";

/** Demo accounts (also listed in the README). */
export const DEMO = {
  admin: { email: "admin@findaguide.rw", password: "Admin@123" },
  guide: { email: "jeanclaude@findaguide.rw", password: "Guide@123" },
  tourist: { email: "emma@example.com", password: "Tourist@123" },
};

const TABLES = [
  "reports", "notifications", "reviews", "messages", "bookings", "verification_documents",
  "availability_dates", "guide_profiles", "tourist_profiles", "admin_profiles", "users",
];

function insertUser(role: string, fullName: string, email: string, phone: string, password: string, daysAgo = 90): string {
  const id = randomUUID();
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  run("INSERT INTO users (id, full_name, email, phone, password_hash, role, created_at) VALUES (?,?,?,?,?,?,?)",
    id, fullName, email, phone, bcrypt.hashSync(password, 10), role, created);
  return id;
}

interface GuideSeed {
  fullName: string; email: string; phone: string; bio: string; languages: string[]; years: number;
  specialization: string; location: string; rwf: number; usd: number; services: string[];
  status: "Verified" | "Pending"; blockedWeekday?: number; days: number;
}

const GUIDES: GuideSeed[] = [
  {
    fullName: "Jean Claude Mugisha", email: DEMO.guide.email, phone: "+250 788 310 421",
    bio: "I grew up in Kinigi at the foot of the Virunga volcanoes and have guided gorilla and golden monkey treks since 2016. I know every ridge of Volcanoes National Park, and I will brief you on gorilla etiquette, fitness preparation and what to pack so that your trek is safe and unforgettable. I also arrange visits to Iby'Iwacu Cultural Village and the Dian Fossey hike.",
    languages: ["English", "French", "Kinyarwanda"], years: 9, specialization: "Gorilla trekking & volcano hikes",
    location: "Volcanoes National Park", rwf: 70000, usd: 50,
    services: ["Gorilla trekking assistance", "Golden monkey tracking", "Dian Fossey tomb hike", "Mount Bisoke crater hike", "Iby'Iwacu cultural village visit", "Airport transfers from Kigali"],
    status: "Verified", days: 150,
  },
  {
    fullName: "Aline Uwase", email: "aline@findaguide.rw", phone: "+250 783 552 190",
    bio: "I am a Kigali-born historian and city guide. My tours explain Rwanda's recovery and today's creative capital: the Kigali Genocide Memorial, Nyamirambo's neighbourhood life, Kimironko market, and the contemporary art scene. I also lead full-day safaris to Akagera National Park for visitors who want savannah wildlife in addition to the city.",
    languages: ["English", "French", "Kinyarwanda", "Swahili"], years: 6, specialization: "Kigali city, history & culture",
    location: "Kigali", rwf: 55000, usd: 38,
    services: ["Kigali Genocide Memorial visit", "Nyamirambo walking tour", "Kimironko market & food tasting", "Inema Arts Center visit", "Akagera day safari", "Airport transfers from Kigali"],
    status: "Verified", blockedWeekday: 0, days: 140,
  },
  {
    fullName: "Eric Habimana", email: "eric@findaguide.rw", phone: "+250 722 904 837",
    bio: "A former Nyungwe park ranger, I now guide birders and primate lovers through one of Africa's oldest rainforests. I lead chimpanzee tracking, the canopy walk and bird-watching trips (over 300 species), and I also guide the Congo Nile Trail and kayaking trips on Lake Kivu for travellers who want to end their journey by the water.",
    languages: ["English", "Kinyarwanda", "Swahili"], years: 12, specialization: "Rainforest, primates & birding",
    location: "Nyungwe National Park", rwf: 65000, usd: 45,
    services: ["Chimpanzee tracking", "Canopy walkway tour", "Guided bird-watching", "Lake Kivu kayaking", "Congo Nile Trail day hike", "Tea plantation visit"],
    status: "Verified", blockedWeekday: 3, days: 120,
  },
  {
    fullName: "Diane Ingabire", email: "diane@findaguide.rw", phone: "+250 789 663 075",
    bio: "I am a wildlife guide specialising in Akagera National Park, where I lead game drives and boat trips to see lions, rhinos, elephants and hippos. I recently completed my safari guiding certification and have submitted my documents for verification.",
    languages: ["English", "French", "Kinyarwanda"], years: 3, specialization: "Savannah safaris & wildlife photography",
    location: "Akagera National Park", rwf: 60000, usd: 42,
    services: ["Game drives", "Boat safari on Lake Ihema", "Wildlife photography guidance", "Sunrise bush breakfast"],
    status: "Pending", days: 20,
  },
];

export function seedDatabase(): void {
  transaction(() => {
    for (const t of TABLES) db.exec(`DELETE FROM ${t}`);

    // ── Administrator ──
    const adminId = insertUser("Admin", "Platform Administrator", DEMO.admin.email, "+250 788 000 001", DEMO.admin.password, 200);
    run("INSERT INTO admin_profiles (user_id, admin_level) VALUES (?, 'Super')", adminId);

    // ── Tourist ──
    const touristId = insertUser("Tourist", "Emma Johnson", DEMO.tourist.email, "+44 7700 900123", DEMO.tourist.password, 60);
    run("INSERT INTO tourist_profiles (user_id, nationality, preferred_language) VALUES (?,?,?)", touristId, "British", "English");

    // ── Guides ──
    const ids: Record<string, string> = {};
    for (const g of GUIDES) {
      const id = insertUser("Guide", g.fullName, g.email, g.phone, "Guide@123", g.days);
      ids[g.email] = id;
      run(
        `INSERT INTO guide_profiles (user_id, bio, languages, experience_years, specialization, location, price_rwf, price_usd, services, verification_status)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        id, g.bio, JSON.stringify(g.languages), g.years, g.specialization, g.location, g.rwf, g.usd, JSON.stringify(g.services), g.status,
      );
      // Open for the next 120 days, except one weekday for some guides.
      for (let i = 0; i < 120; i++) {
        const date = addDays(today(), i);
        if (g.blockedWeekday !== undefined && new Date(`${date}T00:00:00Z`).getUTCDay() === g.blockedWeekday) continue;
        run("INSERT INTO availability_dates (guide_id, date) VALUES (?,?)", id, date);
      }
    }

    // Pending guide: one uploaded credential document.
    const dianeId = ids["diane@findaguide.rw"];
    const storedName = "seed-diane-ingabire-credential.txt";
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, storedName),
      "DEMO DOCUMENT\nRwanda Development Board - Tour Guide Certificate (sample)\nHolder: Diane Ingabire\nSpecialisation: Akagera National Park safari guide\n");
    run("INSERT INTO verification_documents (id, guide_id, file_name, stored_name, uploaded_at) VALUES (?,?,?,?,?)",
      randomUUID(), dianeId, "RDB-Guide-Certificate-Diane-Ingabire.txt", storedName, nowIso());

    // ── Bookings (so every workflow can be tried immediately) ──
    const jc = ids[DEMO.guide.email];
    const aline = ids["aline@findaguide.rw"];
    const eric = ids["eric@findaguide.rw"];
    const insertBooking = (guideId: string, destination: string, start: string, end: string, status: string, notes: string) => {
      const id = randomUUID();
      run(`INSERT INTO bookings (id, tourist_id, guide_id, destination, start_date, end_date, notes, status) VALUES (?,?,?,?,?,?,?,?)`,
        id, touristId, guideId, destination, start, end, notes, status);
      return id;
    };
    const b1 = insertBooking(jc, "Volcanoes National Park", addDays(today(), -32), addDays(today(), -30), "Completed", "Gorilla trek for two people.");
    insertBooking(aline, "Kigali", addDays(today(), -14), addDays(today(), -13), "Completed", "City and memorial tour.");
    insertBooking(eric, "Nyungwe National Park", addDays(today(), 21), addDays(today(), 23), "Pending", "Chimpanzee tracking and canopy walk.");
    insertBooking(jc, "Volcanoes National Park", addDays(today(), 40), addDays(today(), 41), "Confirmed", "Golden monkey tracking.");

    // Completed booking with a review; the second completed booking is left un-reviewed for testing FR 10.
    run("INSERT INTO reviews (id, booking_id, author_id, guide_id, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)",
      randomUUID(), b1, touristId, jc, 5,
      "Jean Claude made our gorilla trek the highlight of our trip. He was patient, knowledgeable and kept us safe on the steep sections.",
      new Date(Date.now() - 28 * 86400000).toISOString());
    recalculateGuideRating(jc);

    // ── Messages & notifications ──
    const msg = (from: string, to: string, content: string, minutesAgo: number, read: boolean) =>
      run("INSERT INTO messages (id, sender_id, receiver_id, content, sent_at, is_read) VALUES (?,?,?,?,?,?)",
        randomUUID(), from, to, content, new Date(Date.now() - minutesAgo * 60000).toISOString(), read ? 1 : 0);
    msg(touristId, jc, "Hello Jean Claude, are you free to guide us again for golden monkey tracking next month?", 600, true);
    msg(jc, touristId, "Hello Emma! Yes, I have kept that date open. I can also arrange a pick-up from Kigali if you wish.", 540, false);

    const note = (userId: string, type: string, message: string, link: string, read = false) =>
      run("INSERT INTO notifications (id, user_id, type, message, link, is_read) VALUES (?,?,?,?,?,?)", randomUUID(), userId, type, message, link, read ? 1 : 0);
    note(touristId, "NewMessage", "New message from Jean Claude Mugisha.", `/messages/${jc}`);
    note(touristId, "BookingCompleted", "Your tour with Aline Uwase is complete. You can now leave a review.", "/dashboard");
    note(eric, "BookingRequest", "New booking request from Emma Johnson for Nyungwe National Park.", "/dashboard");
    note(adminId, "VerificationSubmitted", "Diane Ingabire submitted verification documents for review.", "/admin");
  });
}
