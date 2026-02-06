const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_PATH = path.join(process.cwd(), "data", "local-data.sqlite");

const parseCSV = (text) => {
  text = text.replace(/\r/g, "");
  const lines = text.trim().split("\n");
  const headers = (lines.shift() || "").split(",").map((h) => h.trim());
  const rows = lines.map((line) => {
    const row = [];
    let currentField = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    return row;
  });

  return { headers, rows };
};

const parseBoolean = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return 1;
  if (["false", "0", "no"].includes(normalized)) return 0;
  return null;
};

async function ensureUsersTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      designation TEXT,
      manager TEXT,
      department TEXT,
      lineOfBusiness TEXT,
      location TEXT,
      city TEXT,
      modifierName TEXT,
      modifierEmail TEXT,
      reason TEXT,
      modifiedAt TEXT,
      internetAccess INTEGER,
      requestedSitesToUnblock TEXT,
      externalEmailSending INTEGER,
      externalEmailRecipients TEXT,
      workEmailMobile INTEGER,
      vpnAccess INTEGER,
      vpnType TEXT
    );
  `);
}

async function importCsv(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { headers, rows } = parseCSV(fileContent);
  if (!headers.length) {
    throw new Error("CSV header is empty.");
  }

  const headerMap = headers.reduce((acc, header, idx) => {
    acc[header] = idx;
    return acc;
  }, {});

  const getValue = (values, key) => {
    const idx = headerMap[key];
    if (idx === undefined) return undefined;
    return values[idx] ?? "";
  };

  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await ensureUsersTable(db);

  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM users");
    const insert = await db.prepare(
      `INSERT INTO users (
        id, name, email, designation, manager, department, lineOfBusiness, location, city,
        modifierName, modifierEmail, reason, modifiedAt,
        internetAccess, requestedSitesToUnblock, externalEmailSending, externalEmailRecipients,
        workEmailMobile, vpnAccess, vpnType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      for (const values of rows) {
        const id = getValue(values, "id");
        const email = getValue(values, "email");
        if (!id || !email) {
          continue;
        }

        await insert.run(
          id,
          getValue(values, "name") || "",
          email,
          getValue(values, "designation") || null,
          getValue(values, "manager") || null,
          getValue(values, "department") || null,
          getValue(values, "lineOfBusiness") || null,
          getValue(values, "location") || null,
          getValue(values, "city") || null,
          getValue(values, "modifierName") || null,
          getValue(values, "modifierEmail") || null,
          getValue(values, "reason") || null,
          getValue(values, "modifiedAt") || null,
          parseBoolean(getValue(values, "internetAccess")),
          getValue(values, "requestedSitesToUnblock") || null,
          parseBoolean(getValue(values, "externalEmailSending")),
          getValue(values, "externalEmailRecipients") || null,
          parseBoolean(getValue(values, "workEmailMobile")),
          parseBoolean(getValue(values, "vpnAccess")),
          getValue(values, "vpnType") || null
        );
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.close();
  }
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/import-csv-to-sqlite.js <csv-path>");
  process.exit(1);
}

importCsv(inputPath)
  .then(() => {
    console.log("CSV import completed.");
  })
  .catch((error) => {
    console.error("CSV import failed:", error);
    process.exit(1);
  });
