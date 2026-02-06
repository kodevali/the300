import path from "path";
import { promises as fs } from "fs";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

const DB_PATH = path.join(process.cwd(), "data", "local-data.sqlite");

let dbPromise: Promise<Database> | null = null;
let initPromise: Promise<void> | null = null;

const DEFAULT_IT_ACCESS_FEATURES = [
  {
    id: "internet-access",
    name: "Internet Access",
    description: "Standard network and external internet connectivity",
    enabled: true,
  },
  {
    id: "external-email",
    name: "External Email Sending",
    description: "Ability to send emails outside the internal bank network",
    enabled: true,
  },
  {
    id: "mobile-email",
    name: "Work Email Setup on Mobile",
    description: "Configuration of corporate email account on mobile device",
    enabled: true,
  },
  {
    id: "vpn-access",
    name: "VPN Access",
    description: "Secure remote access to the internal company network",
    enabled: true,
  },
];

async function ensureDataDirectory() {
  const dataDir = path.dirname(DB_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      await ensureDataDirectory();
      return open({
        filename: DB_PATH,
        driver: sqlite3.Database,
      });
    })();
  }
  return dbPromise;
}

async function initDb(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await getDb();
    await db.exec(`
      PRAGMA journal_mode = WAL;
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
      CREATE TABLE IF NOT EXISTS roles (
        lob TEXT PRIMARY KEY,
        groupHead TEXT,
        delegatesJson TEXT
      );
      CREATE TABLE IF NOT EXISTS admins (
        email TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS reasons (
        reason TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS locks (
        lob TEXT PRIMARY KEY,
        isLocked INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS summary_view_lobs (
        lob TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS summary_view_delegate_lobs (
        lob TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS consolidated_view_users (
        email TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        toJson TEXT NOT NULL,
        ccJson TEXT NOT NULL,
        bccJson TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS changelog (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        userName TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        userRolesJson TEXT NOT NULL,
        action TEXT NOT NULL,
        detailsJson TEXT
      );
      CREATE TABLE IF NOT EXISTS it_access_features (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        enabled INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS office_requests (
        id TEXT PRIMARY KEY,
        department TEXT NOT NULL,
        lineOfBusiness TEXT NOT NULL,
        requestedByName TEXT NOT NULL,
        requestedByEmail TEXT NOT NULL,
        requestedAt TEXT NOT NULL,
        itAccessFeaturesJson TEXT NOT NULL,
        hrTemplateFileJson TEXT,
        status TEXT NOT NULL,
        approvedByName TEXT,
        approvedByEmail TEXT,
        approvedAt TEXT,
        notes TEXT
      );
    `);

    const notificationRow = await db.get<{ id: number }>(
      "SELECT id FROM notifications WHERE id = 1"
    );
    if (!notificationRow) {
      await db.run(
        "INSERT INTO notifications (id, toJson, ccJson, bccJson) VALUES (1, ?, ?, ?)",
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([])
      );
    }

    const featureCountRow = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM it_access_features"
    );
    if (!featureCountRow || featureCountRow.count === 0) {
      const insertFeature = await db.prepare(
        "INSERT INTO it_access_features (id, name, description, enabled) VALUES (?, ?, ?, ?)"
      );
      try {
        for (const feature of DEFAULT_IT_ACCESS_FEATURES) {
          await insertFeature.run(
            feature.id,
            feature.name,
            feature.description ?? null,
            feature.enabled ? 1 : 0
          );
        }
      } finally {
        await insertFeature.finalize();
      }
    }
  })();

  return initPromise;
}

export async function getSqliteDb(): Promise<Database> {
  await initDb();
  return getDb();
}
