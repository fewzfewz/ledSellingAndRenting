const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function runMigration() {
  try {
    const sqlPath = path.join(
      __dirname,
      "migrations",
      "009_some_fix_onChat.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running chats table migration...");
    await pool.query(sql);
    console.log("Chats table migration completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
