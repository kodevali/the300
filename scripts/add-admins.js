const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_PATH = path.join(process.cwd(), "data", "local-data.sqlite");

async function addAdmins(emails) {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY
    );
  `);

  await db.exec("BEGIN");
  try {
    const stmt = await db.prepare("INSERT OR IGNORE INTO admins (email) VALUES (?)");
    try {
      for (const email of emails) {
        if (!email) continue;
        await stmt.run(email.toLowerCase());
      }
    } finally {
      await stmt.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.close();
  }
}

const adminsToAdd = [
  "arsalan.mazhar@jsbl.com",
  "muhammad.owais@jsbl.com",
  "kodev.ali@jsbl.com",
  "waseem.askari@jsbl.com",
];

addAdmins(adminsToAdd)
  .then(() => {
    console.log("Admins added/ensured in database.");
  })
  .catch((err) => {
    console.error("Failed to add admins:", err);
    process.exit(1);
  });

