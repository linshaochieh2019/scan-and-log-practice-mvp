import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error("Copy .env.local.example to .env.local and fill in values");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleLogs = [
  {
    barcode: "4710088412345",
    scan_type: "receive",
    status: "received",
    latitude: 25.033,
    longitude: 121.5654,
    notes: "Pallet A - Bay 3",
    synced: true,
  },
  {
    barcode: "4710088498765",
    scan_type: "dispatch",
    status: "dispatched",
    latitude: 25.033,
    longitude: 121.5654,
    notes: "Outbound truck #12",
    synced: true,
  },
  {
    barcode: "4710088456789",
    scan_type: "check",
    status: "checked",
    latitude: 25.0331,
    longitude: 121.5655,
    notes: "Inventory audit - shelf B2",
    synced: false,
  },
];

async function seed() {
  // Requires at least one auth user to exist — seed with service role
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers();

  if (users.length === 0) {
    console.log("No users found. Create a user first, then re-run.");
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`Seeding scan_logs for user: ${userId}`);

  const logs = sampleLogs.map((log) => ({ ...log, user_id: userId }));

  const { data, error } = await supabase.from("scan_logs").insert(logs);

  if (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${logs.length} scan logs.`);
}

seed();
