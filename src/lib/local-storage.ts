'use server';

import { getSqliteDb } from "./sqlite";

export type User = {
  id: string;
  name: string;
  email: string;
  designation?: string;
  manager?: string;
  department?: string;
  lineOfBusiness?: string;
  location?: string;
  city?: string;
  modifier?: {
    name: string;
    email: string;
  };
  reason?: string;
  modifiedAt?: string;
  internetAccess?: boolean;
  requestedSitesToUnblock?: string;
  externalEmailSending?: boolean;
  externalEmailRecipients?: string;
  workEmailMobile?: boolean;
  vpnAccess?: boolean;
  vpnType?: "internal" | "external";
};

export type Roles = {
  groupHead: string | null;
  delegates: string[];
};

export type ITAccessFeature = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
};

export type OfficeRequest = {
  id: string;
  department: string;
  lineOfBusiness: string;
  requestedBy: {
    name: string;
    email: string;
  };
  requestedAt: string;
  itAccessFeatures: string[];
  hrTemplateFile?: {
    fileName: string;
    uploadedAt: string;
    fileSize: number;
  };
  status: "pending" | "approved" | "rejected";
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  notes?: string;
};

export type LocalData = {
  users: User[];
  roles: Record<string, Roles>;
  admins: string[];
  reasons: string[];
  locks: Record<string, boolean>;
  summaryViewLobs: string[];
  summaryViewDelegateLobs: string[];
  consolidatedViewUsers: string[];
  notifications: {
    to: string[];
    cc: string[];
    bcc: string[];
  };
  changelog: Array<{
    id: string;
    timestamp: string;
    user: { name: string; email: string; roles: string[] };
    action: string;
    details?: Record<string, any>;
  }>;
  itAccessFeatures: ITAccessFeature[];
  officeRequests: OfficeRequest[];
};

const toBoolean = (value: number | null | undefined) =>
  value === 1 || value === true;
const fromBoolean = (value: boolean | undefined) => (value ? 1 : 0);
const parseJson = <T,>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapUserRow = (row: any): User => {
  const user: User = {
    id: row.id,
    name: row.name,
    email: row.email,
    designation: row.designation ?? undefined,
    manager: row.manager ?? undefined,
    department: row.department ?? undefined,
    lineOfBusiness: row.lineOfBusiness ?? undefined,
    location: row.location ?? undefined,
    city: row.city ?? undefined,
  };

  if (row.modifierName || row.modifierEmail) {
    user.modifier = {
      name: row.modifierName ?? "",
      email: row.modifierEmail ?? "",
    };
  }
  if (row.reason !== null && row.reason !== undefined) {
    user.reason = row.reason;
  }
  if (row.modifiedAt) {
    user.modifiedAt = row.modifiedAt;
  }

  if (row.internetAccess !== null && row.internetAccess !== undefined) {
    user.internetAccess = toBoolean(row.internetAccess);
  }
  if (row.requestedSitesToUnblock) {
    user.requestedSitesToUnblock = row.requestedSitesToUnblock;
  }
  if (row.externalEmailSending !== null && row.externalEmailSending !== undefined) {
    user.externalEmailSending = toBoolean(row.externalEmailSending);
  }
  if (row.externalEmailRecipients) {
    user.externalEmailRecipients = row.externalEmailRecipients;
  }
  if (row.workEmailMobile !== null && row.workEmailMobile !== undefined) {
    user.workEmailMobile = toBoolean(row.workEmailMobile);
  }
  if (row.vpnAccess !== null && row.vpnAccess !== undefined) {
    user.vpnAccess = toBoolean(row.vpnAccess);
  }
  if (row.vpnType) {
    user.vpnType = row.vpnType;
  }

  return user;
};

const mapOfficeRequestRow = (row: any): OfficeRequest => ({
  id: row.id,
  department: row.department,
  lineOfBusiness: row.lineOfBusiness,
  requestedBy: {
    name: row.requestedByName,
    email: row.requestedByEmail,
  },
  requestedAt: row.requestedAt,
  itAccessFeatures: parseJson<string[]>(row.itAccessFeaturesJson, []),
  hrTemplateFile: parseJson<OfficeRequest["hrTemplateFile"]>(
    row.hrTemplateFileJson,
    undefined
  ),
  status: row.status,
  approvedBy:
    row.approvedByName || row.approvedByEmail
      ? { name: row.approvedByName ?? "", email: row.approvedByEmail ?? "" }
      : undefined,
  approvedAt: row.approvedAt ?? undefined,
  notes: row.notes ?? undefined,
});

// Get all data (composed from individual tables)
export async function getAllData(): Promise<LocalData> {
  const [
    users,
    roles,
    admins,
    reasons,
    locks,
    summaryViewLobs,
    summaryViewDelegateLobs,
    consolidatedViewUsers,
    notifications,
    changelog,
    itAccessFeatures,
    officeRequests,
  ] = await Promise.all([
    getUsers(),
    getRoles(),
    getAdmins(),
    getReasons(),
    getAllLockStatuses(),
    getSummaryViewLobs(),
    getSummaryViewDelegateLobs(),
    getConsolidatedViewUsers(),
    getNotificationConfig(),
    getLogs(),
    getITAccessFeatures(),
    getOfficeRequests(),
  ]);

  return {
    users,
    roles,
    admins,
    reasons,
    locks,
    summaryViewLobs,
    summaryViewDelegateLobs,
    consolidatedViewUsers,
    notifications,
    changelog: changelog.map((entry) => ({
      id: `${entry.timestamp}-${entry.user.email}`,
      ...entry,
    })),
    itAccessFeatures,
    officeRequests,
  };
}

// Users operations
export async function getUsers(): Promise<User[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT * FROM users");
  return rows.map(mapUserRow);
}

export async function saveUsers(users: User[]): Promise<void> {
  const db = await getSqliteDb();
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
      for (const user of users) {
        await insert.run(
          user.id,
          user.name,
          user.email,
          user.designation ?? null,
          user.manager ?? null,
          user.department ?? null,
          user.lineOfBusiness ?? null,
          user.location ?? null,
          user.city ?? null,
          user.modifier?.name ?? null,
          user.modifier?.email ?? null,
          user.reason ?? null,
          user.modifiedAt ?? null,
          fromBoolean(user.internetAccess),
          user.requestedSitesToUnblock ?? null,
          fromBoolean(user.externalEmailSending),
          user.externalEmailRecipients ?? null,
          fromBoolean(user.workEmailMobile),
          fromBoolean(user.vpnAccess),
          user.vpnType ?? null
        );
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function updateUser(user: User): Promise<void> {
  const db = await getSqliteDb();
  const existingRow = await db.get("SELECT * FROM users WHERE id = ?", user.id);
  const existingUser = existingRow ? mapUserRow(existingRow) : undefined;
  const mergedUser: User = {
    ...(existingUser || {}),
    ...user,
    modifiedAt: new Date().toISOString(),
  };

  if (user.reason === undefined) {
    delete mergedUser.reason;
  }

  await db.run(
    `INSERT INTO users (
      id, name, email, designation, manager, department, lineOfBusiness, location, city,
      modifierName, modifierEmail, reason, modifiedAt,
      internetAccess, requestedSitesToUnblock, externalEmailSending, externalEmailRecipients,
      workEmailMobile, vpnAccess, vpnType
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      designation = excluded.designation,
      manager = excluded.manager,
      department = excluded.department,
      lineOfBusiness = excluded.lineOfBusiness,
      location = excluded.location,
      city = excluded.city,
      modifierName = excluded.modifierName,
      modifierEmail = excluded.modifierEmail,
      reason = excluded.reason,
      modifiedAt = excluded.modifiedAt,
      internetAccess = excluded.internetAccess,
      requestedSitesToUnblock = excluded.requestedSitesToUnblock,
      externalEmailSending = excluded.externalEmailSending,
      externalEmailRecipients = excluded.externalEmailRecipients,
      workEmailMobile = excluded.workEmailMobile,
      vpnAccess = excluded.vpnAccess,
      vpnType = excluded.vpnType`,
    mergedUser.id,
    mergedUser.name,
    mergedUser.email,
    mergedUser.designation ?? null,
    mergedUser.manager ?? null,
    mergedUser.department ?? null,
    mergedUser.lineOfBusiness ?? null,
    mergedUser.location ?? null,
    mergedUser.city ?? null,
    mergedUser.modifier?.name ?? null,
    mergedUser.modifier?.email ?? null,
    mergedUser.reason ?? null,
    mergedUser.modifiedAt ?? null,
    fromBoolean(mergedUser.internetAccess),
    mergedUser.requestedSitesToUnblock ?? null,
    fromBoolean(mergedUser.externalEmailSending),
    mergedUser.externalEmailRecipients ?? null,
    fromBoolean(mergedUser.workEmailMobile),
    fromBoolean(mergedUser.vpnAccess),
    mergedUser.vpnType ?? null
  );
}

export async function removeUser(id: string): Promise<void> {
  const db = await getSqliteDb();
  await db.run("DELETE FROM users WHERE id = ?", id);
}

export async function removeAllUsers(): Promise<void> {
  const db = await getSqliteDb();
  await db.run("DELETE FROM users");
}

export async function clearAllSelections(): Promise<void> {
  const db = await getSqliteDb();
  await db.run(
    `UPDATE users
     SET modifierName = NULL,
         modifierEmail = NULL,
         reason = NULL,
         modifiedAt = NULL`
  );
}

// Roles operations
export async function getRoles(): Promise<Record<string, Roles>> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT lob, groupHead, delegatesJson FROM roles");
  return rows.reduce((acc: Record<string, Roles>, row: any) => {
    acc[row.lob] = {
      groupHead: row.groupHead ?? null,
      delegates: parseJson<string[]>(row.delegatesJson, []),
    };
    return acc;
  }, {});
}

export async function saveRoles(roles: Record<string, Roles>): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM roles");
    const insert = await db.prepare(
      "INSERT INTO roles (lob, groupHead, delegatesJson) VALUES (?, ?, ?)"
    );
    try {
      for (const [lob, role] of Object.entries(roles)) {
        await insert.run(lob, role.groupHead ?? null, JSON.stringify(role.delegates || []));
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

// Admins operations
export async function getAdmins(): Promise<string[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT email FROM admins");
  return rows.map((row: any) => row.email);
}

export async function saveAdmins(admins: string[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM admins");
    const insert = await db.prepare("INSERT INTO admins (email) VALUES (?)");
    try {
      for (const email of admins) {
        await insert.run(email.toLowerCase());
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

// Reasons operations
export async function getReasons(): Promise<string[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT reason FROM reasons");
  return rows.map((row: any) => row.reason);
}

export async function saveReasons(reasons: string[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM reasons");
    const insert = await db.prepare("INSERT INTO reasons (reason) VALUES (?)");
    try {
      for (const reason of reasons) {
        await insert.run(reason);
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

// Locks operations
export async function getLockStatus(lob: string): Promise<boolean> {
  const db = await getSqliteDb();
  const row = await db.get("SELECT isLocked FROM locks WHERE lob = ?", lob);
  return row ? toBoolean(row.isLocked) : false;
}

export async function getAllLockStatuses(): Promise<Record<string, boolean>> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT lob, isLocked FROM locks");
  return rows.reduce((acc: Record<string, boolean>, row: any) => {
    acc[row.lob] = toBoolean(row.isLocked);
    return acc;
  }, {});
}

export async function saveLockStatus(lob: string, isLocked: boolean): Promise<void> {
  const db = await getSqliteDb();
  await db.run(
    `INSERT INTO locks (lob, isLocked) VALUES (?, ?)
     ON CONFLICT(lob) DO UPDATE SET isLocked = excluded.isLocked`,
    lob,
    fromBoolean(isLocked)
  );
}

export async function unlockAllLobs(): Promise<void> {
  const db = await getSqliteDb();
  const rows = await db.all(
    "SELECT DISTINCT lineOfBusiness as lob FROM users WHERE lineOfBusiness IS NOT NULL"
  );
  for (const row of rows) {
    await db.run(
      `INSERT INTO locks (lob, isLocked) VALUES (?, 0)
       ON CONFLICT(lob) DO UPDATE SET isLocked = 0`,
      row.lob
    );
  }
}

// Summary view operations
export async function getSummaryViewLobs(): Promise<string[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT lob FROM summary_view_lobs");
  return rows.map((row: any) => row.lob);
}

export async function saveSummaryViewLobs(lobs: string[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM summary_view_lobs");
    const insert = await db.prepare("INSERT INTO summary_view_lobs (lob) VALUES (?)");
    try {
      for (const lob of lobs) {
        await insert.run(lob);
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function getSummaryViewDelegateLobs(): Promise<string[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT lob FROM summary_view_delegate_lobs");
  return rows.map((row: any) => row.lob);
}

export async function saveSummaryViewDelegateLobs(lobs: string[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM summary_view_delegate_lobs");
    const insert = await db.prepare(
      "INSERT INTO summary_view_delegate_lobs (lob) VALUES (?)"
    );
    try {
      for (const lob of lobs) {
        await insert.run(lob);
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

// Consolidated view operations
export async function getConsolidatedViewUsers(): Promise<string[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT email FROM consolidated_view_users");
  return rows.map((row: any) => row.email);
}

export async function saveConsolidatedViewUsers(userEmails: string[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM consolidated_view_users");
    const insert = await db.prepare(
      "INSERT INTO consolidated_view_users (email) VALUES (?)"
    );
    try {
      for (const email of userEmails) {
        await insert.run(email.toLowerCase());
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

// Notifications operations
export async function getNotificationConfig(): Promise<{
  to: string[];
  cc: string[];
  bcc: string[];
}> {
  const db = await getSqliteDb();
  const row = await db.get("SELECT toJson, ccJson, bccJson FROM notifications WHERE id = 1");
  return {
    to: parseJson<string[]>(row?.toJson, []),
    cc: parseJson<string[]>(row?.ccJson, []),
    bcc: parseJson<string[]>(row?.bccJson, []),
  };
}

export async function saveNotificationConfig(config: {
  to: string[];
  cc: string[];
  bcc: string[];
}): Promise<void> {
  const db = await getSqliteDb();
  await db.run(
    `INSERT INTO notifications (id, toJson, ccJson, bccJson)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       toJson = excluded.toJson,
       ccJson = excluded.ccJson,
       bccJson = excluded.bccJson`,
    JSON.stringify(config.to || []),
    JSON.stringify(config.cc || []),
    JSON.stringify(config.bcc || [])
  );
}

// Changelog operations
export async function addLogEntry(entry: {
  user: { name: string; email: string; roles: string[] };
  action: string;
  details?: Record<string, any>;
}): Promise<void> {
  const db = await getSqliteDb();
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 9);
  const timestamp = new Date().toISOString();
  await db.run(
    `INSERT INTO changelog (id, timestamp, userName, userEmail, userRolesJson, action, detailsJson)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    timestamp,
    entry.user.name,
    entry.user.email,
    JSON.stringify(entry.user.roles || []),
    entry.action,
    entry.details ? JSON.stringify(entry.details) : null
  );
}

export async function getLogs(): Promise<Array<{
  timestamp: string;
  user: { name: string; email: string; roles: string[] };
  action: string;
  details?: Record<string, any>;
}>> {
  const db = await getSqliteDb();
  const rows = await db.all(
    "SELECT timestamp, userName, userEmail, userRolesJson, action, detailsJson FROM changelog ORDER BY timestamp DESC"
  );
  return rows.map((row: any) => ({
    timestamp: row.timestamp,
    user: {
      name: row.userName,
      email: row.userEmail,
      roles: parseJson<string[]>(row.userRolesJson, []),
    },
    action: row.action,
    details: parseJson<Record<string, any> | undefined>(row.detailsJson, undefined),
  }));
}

export async function clearLogs(): Promise<void> {
  const db = await getSqliteDb();
  await db.run("DELETE FROM changelog");
}

// IT Access Features operations
export async function getITAccessFeatures(): Promise<ITAccessFeature[]> {
  const db = await getSqliteDb();
  const rows = await db.all(
    "SELECT id, name, description, enabled FROM it_access_features ORDER BY name ASC"
  );
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    enabled: toBoolean(row.enabled),
  }));
}

export async function saveITAccessFeatures(features: ITAccessFeature[]): Promise<void> {
  const db = await getSqliteDb();
  await db.exec("BEGIN");
  try {
    await db.run("DELETE FROM it_access_features");
    const insert = await db.prepare(
      "INSERT INTO it_access_features (id, name, description, enabled) VALUES (?, ?, ?, ?)"
    );
    try {
      for (const feature of features) {
        await insert.run(
          feature.id,
          feature.name,
          feature.description ?? null,
          fromBoolean(feature.enabled)
        );
      }
    } finally {
      await insert.finalize();
    }
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function updateITAccessFeature(
  featureId: string,
  updates: Partial<ITAccessFeature>
): Promise<void> {
  const db = await getSqliteDb();
  const existingRow = await db.get(
    "SELECT id, name, description, enabled FROM it_access_features WHERE id = ?",
    featureId
  );
  const existing = existingRow
    ? {
        id: existingRow.id,
        name: existingRow.name,
        description: existingRow.description ?? undefined,
        enabled: toBoolean(existingRow.enabled),
      }
    : { id: featureId, name: "", enabled: true } as ITAccessFeature;

  const merged = { ...existing, ...updates };

  await db.run(
    `INSERT INTO it_access_features (id, name, description, enabled)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       enabled = excluded.enabled`,
    merged.id,
    merged.name,
    merged.description ?? null,
    fromBoolean(merged.enabled)
  );
}

// Office Requests operations
export async function getOfficeRequests(): Promise<OfficeRequest[]> {
  const db = await getSqliteDb();
  const rows = await db.all("SELECT * FROM office_requests ORDER BY requestedAt DESC");
  return rows.map(mapOfficeRequestRow);
}

export async function createOfficeRequest(
  request: Omit<OfficeRequest, "id" | "requestedAt" | "status">
): Promise<OfficeRequest> {
  const db = await getSqliteDb();
  const newRequest: OfficeRequest = {
    ...request,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    requestedAt: new Date().toISOString(),
    status: "pending",
  };

  await db.run(
    `INSERT INTO office_requests (
      id, department, lineOfBusiness, requestedByName, requestedByEmail, requestedAt,
      itAccessFeaturesJson, hrTemplateFileJson, status, approvedByName, approvedByEmail, approvedAt, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newRequest.id,
    newRequest.department,
    newRequest.lineOfBusiness,
    newRequest.requestedBy.name,
    newRequest.requestedBy.email,
    newRequest.requestedAt,
    JSON.stringify(newRequest.itAccessFeatures || []),
    newRequest.hrTemplateFile ? JSON.stringify(newRequest.hrTemplateFile) : null,
    newRequest.status,
    newRequest.approvedBy?.name ?? null,
    newRequest.approvedBy?.email ?? null,
    newRequest.approvedAt ?? null,
    newRequest.notes ?? null
  );

  return newRequest;
}

export async function updateOfficeRequest(
  requestId: string,
  updates: Partial<OfficeRequest>
): Promise<void> {
  const db = await getSqliteDb();
  const existingRow = await db.get("SELECT * FROM office_requests WHERE id = ?", requestId);
  if (!existingRow) {
    return;
  }
  const existing = mapOfficeRequestRow(existingRow);
  const merged = { ...existing, ...updates };

  await db.run(
    `UPDATE office_requests
     SET department = ?, lineOfBusiness = ?, requestedByName = ?, requestedByEmail = ?, requestedAt = ?,
         itAccessFeaturesJson = ?, hrTemplateFileJson = ?, status = ?, approvedByName = ?, approvedByEmail = ?,
         approvedAt = ?, notes = ?
     WHERE id = ?`,
    merged.department,
    merged.lineOfBusiness,
    merged.requestedBy.name,
    merged.requestedBy.email,
    merged.requestedAt,
    JSON.stringify(merged.itAccessFeatures || []),
    merged.hrTemplateFile ? JSON.stringify(merged.hrTemplateFile) : null,
    merged.status,
    merged.approvedBy?.name ?? null,
    merged.approvedBy?.email ?? null,
    merged.approvedAt ?? null,
    merged.notes ?? null,
    merged.id
  );
}

export async function deleteOfficeRequest(requestId: string): Promise<void> {
  const db = await getSqliteDb();
  await db.run("DELETE FROM office_requests WHERE id = ?", requestId);
}
