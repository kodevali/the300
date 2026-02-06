"use server";

import type { GetWorkspaceUsersOutput, User } from "@/ai/schemas/workspace-users";
import { getCachedUsers, cacheUsers, removeAllUsers, updateUser, removeUser, clearAllSelections } from "@/services/workspace-service";
import { getRoles, saveRoles } from "@/services/role-service";
import type { Roles } from "@/lib/local-storage";
import { getAdmins, saveAdmins } from "@/services/admin-service";
import { getReasons, saveReasons } from "@/services/reason-service";
import { getLockStatus, saveLockStatus, unlockAllLobs, getAllLockStatuses } from "@/services/lock-service";
import { getSummaryViewLobs, saveSummaryViewLobs } from "@/services/summary-view-service";
import { getSummaryViewDelegateLobs, saveSummaryViewDelegateLobs } from "@/services/summary-view-delegates-service";
import { getConsolidatedViewUsers, saveConsolidatedViewUsers } from "@/services/consolidated-view-service";
import { sendLockNotification } from "@/services/email-service";
import { getNotificationConfig, saveNotificationConfig, type NotificationConfig } from "@/services/notification-service";
import { logAction, getLogs, clearAllLogs, type LogEntry } from "@/services/log-service";


export async function getDashboardDataAction() {
    const [usersResponse, roles, admins, reasons, summaryLobs, summaryDelegateLobs, consolidatedUsers, allLocks] = await Promise.all([
        getWorkspaceUsersAction(),
        getRolesAction(),
        getAdminsAction(),
        getReasonsAction(),
        getSummaryViewLobsAction(),
        getSummaryViewDelegateLobsAction(),
        getConsolidatedViewUsersAction(),
        getAllLockStatusesAction(),
    ]);

    const fetchedUsers = usersResponse.users || [];
    const uniqueUsersMap = new Map<string, User>();
    fetchedUsers.forEach(user => {
      if (user.id) {
        uniqueUsersMap.set(user.id, user);
      }
    });
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    return {
        users: uniqueUsers,
        roles,
        admins,
        reasons,
        summaryViewLobs: summaryLobs,
        summaryViewDelegateLobs: summaryDelegateLobs,
        consolidatedViewUsers: consolidatedUsers,
        lobLocks: allLocks,
    };
}

export async function getAdminPageDataAction(userLobs: string[], authStatus: 'admin' | 'groupHead') {
    const [
        usersResponse,
        rolesResponse,
        adminsResponse,
        reasonsResponse,
        summaryLobsResponse,
        summaryDelegateLobsResponse,
        consolidatedUsersResponse,
        notificationConfigResponse,
    ] = await Promise.all([
        getWorkspaceUsersAction(),
        getRolesAction(),
        getAdminsAction(),
        getReasonsAction(),
        getSummaryViewLobsAction(),
        getSummaryViewDelegateLobsAction(),
        authStatus === 'admin' ? getConsolidatedViewUsersAction() : Promise.resolve([]),
        authStatus === 'admin' ? getNotificationConfigAction() : Promise.resolve({ to: [], cc: [], bcc: []}),
    ]);

    const fetchedUsers = usersResponse.users || [];
    const uniqueUsersMap = new Map<string, User>();
    fetchedUsers.forEach(user => {
      if(user.id) {
          uniqueUsersMap.set(user.id, user);
      }
    });
    const allUsers = Array.from(uniqueUsersMap.values());
    
    const lobsForLocks = authStatus === 'admin'
        ? Array.from(new Set(allUsers.map(u => u.lineOfBusiness)))
        : userLobs;

    const lockPromises = lobsForLocks.filter((lob): lob is string => !!lob).map(lob => getLockStatusAction(lob).then(isLocked => ({ lob, isLocked })));
    const lockResults = await Promise.all(lockPromises);
    const lobLocks = lockResults.reduce((acc, result) => {
        if (result.lob) {
            acc[result.lob] = result.isLocked;
        }
        return acc;
    }, {} as Record<string, boolean>);

    return {
        users: allUsers,
        roles: rolesResponse,
        admins: adminsResponse,
        reasons: reasonsResponse,
        summaryViewLobs: summaryLobsResponse,
        summaryViewDelegateLobs: summaryDelegateLobsResponse,
        consolidatedViewUsers: consolidatedUsersResponse,
        notificationConfig: notificationConfigResponse,
        lobLocks,
    };
}


export async function getWorkspaceUsersAction(): Promise<GetWorkspaceUsersOutput> {
  const users = await getCachedUsers();
  return { users };
}

export async function removeAllUsersAction(actor: { name: string; email: string; roles: string[] }): Promise<GetWorkspaceUsersOutput> {
  await removeAllUsers();
  await logAction(actor, "Removed All Users");
  return { users: [] };
}

export async function removeUserAction(id: string): Promise<void> {
  await removeUser(id);
}

export async function importUsersAction(users: User[], actor: { name: string; email: string; roles: string[] }): Promise<GetWorkspaceUsersOutput> {
  await cacheUsers(users);
  await logAction(actor, `Imported ${users.length} Users`);
  const updatedUsers = await getCachedUsers();
  return { users: updatedUsers };
}

export async function updateUserAction(user: User, actor: { name: string; email: string; roles: string[] }): Promise<void> {
  const userToUpdate = { ...user };
  
  const userWithActor = { ...userToUpdate, modifier: actor };
  await updateUser(userWithActor);

  let logMessage = '';
  if (!userToUpdate.reason && userToUpdate.modifier) {
    logMessage = `Deselected employee ${user.name} (${user.email})`;
  }
  else if (userToUpdate.reason === "NOT_SELECTED") {
    logMessage = `Selected employee ${user.name} (${user.email})`;
  }
  else if (userToUpdate.reason) {
     logMessage = `Updated reason for ${user.name} (${user.email}) to "${user.reason}"`;
  }

  if (logMessage) {
    await logAction(actor, logMessage, { employeeEmail: user.email });
  }
}

export async function getRolesAction(): Promise<Record<string, Roles>> {
    return await getRoles();
}

export async function saveRolesAction(roles: Record<string, Roles>, actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveRoles(roles);
    await logAction(actor, "Updated Role Assignments");
}

export async function getAdminsAction(): Promise<string[]> {
    return await getAdmins();
}

export async function saveAdminsAction(adminEmails: string[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveAdmins(adminEmails);
    await logAction(actor, "Updated Admin List", { admins: adminEmails });
}

export async function getReasonsAction(): Promise<string[]> {
    return await getReasons();
}

export async function saveReasonsAction(reasons: string[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveReasons(reasons);
    await logAction(actor, "Updated Allocation Reasons");
}

export async function getLockStatusAction(lob: string): Promise<boolean> {
    return await getLockStatus(lob);
}

export async function getAllLockStatusesAction(): Promise<Record<string, boolean>> {
    return await getAllLockStatuses();
}

export async function saveLockStatusAction(lob: string, isLocked: boolean, actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveLockStatus(lob, isLocked);
    const action = isLocked ? 'Locked Roster' : 'Unlocked Roster';
    await logAction(actor, action, { lob });

    if (isLocked) {
        await sendLockNotificationEmailAction(lob, actor);
    }
}

export async function getSummaryViewLobsAction(): Promise<string[]> {
    return await getSummaryViewLobs();
}

export async function saveSummaryViewLobsAction(lobs: string[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveSummaryViewLobs(lobs);
    await logAction(actor, "Updated Summary View Access (Group Heads)", { lobs });
}

export async function getSummaryViewDelegateLobsAction(): Promise<string[]> {
    return await getSummaryViewDelegateLobs();
}

export async function saveSummaryViewDelegateLobsAction(lobs: string[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveSummaryViewDelegateLobs(lobs);
    await logAction(actor, "Updated Summary View Access (Delegates)", { lobs });
}

export async function getConsolidatedViewUsersAction(): Promise<string[]> {
    return await getConsolidatedViewUsers();
}

export async function saveConsolidatedViewUsersAction(userEmails: string[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveConsolidatedViewUsers(userEmails);
    await logAction(actor, "Updated Consolidated View Access", { users: userEmails });
}

export async function getNotificationConfigAction(): Promise<NotificationConfig> {
    return await getNotificationConfig();
}

export async function saveNotificationConfigAction(config: NotificationConfig, actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await saveNotificationConfig(config);
    await logAction(actor, "Updated Email Notification Settings");
}

export async function resetForGoLiveAction(actor: { name: string; email: string; roles: string[] }): Promise<void> {
    await clearAllSelections();
    await unlockAllLobs();
    await clearAllLogs();
    await logAction(actor, "Performed 'Reset for Go-Live' (Cleared Selections, Unlocked LOBs, Cleared Change Log)");
}

export async function sendLockNotificationEmailAction(lob: string, actor: { name: string; email: string; roles: string[] }) {
    const allUsers = await getCachedUsers();
    const allRoles = await getRoles();
    const adminEmails = await getAdmins();
    const notificationConfig = await getNotificationConfig();
    const admins = allUsers.filter(u => u.email && adminEmails.includes(u.email.toLowerCase()));

    await sendLockNotification({
        lob,
        allUsers,
        allRoles,
        admins,
        actor,
        notificationConfig
    });
}

export async function getChangeLogsAction(): Promise<Omit<LogEntry, 'id'>[]> {
  const logs = await getLogs();
  return logs; // Logs already have ISO string timestamps from local storage
}

// IT Access Features Actions
import { 
  getITAccessFeatures, 
  saveITAccessFeatures, 
  updateITAccessFeature,
  getOfficeRequests,
  createOfficeRequest,
  updateOfficeRequest,
  deleteOfficeRequest
} from '@/services/it-access-service';
import type { ITAccessFeature, OfficeRequest } from '@/lib/local-storage';

export async function getITAccessFeaturesAction(): Promise<ITAccessFeature[]> {
  return await getITAccessFeatures();
}

export async function saveITAccessFeaturesAction(features: ITAccessFeature[], actor: { name: string; email: string; roles: string[] }): Promise<void> {
  await saveITAccessFeatures(features);
  await logAction(actor, "Updated IT Access Features", { features });
}

export async function getOfficeRequestsAction(): Promise<OfficeRequest[]> {
  return await getOfficeRequests();
}

export async function createOfficeRequestAction(
  request: Omit<OfficeRequest, 'id' | 'requestedAt' | 'status'>,
  actor: { name: string; email: string; roles: string[] }
): Promise<OfficeRequest> {
  const newRequest = await createOfficeRequest(request);
  await logAction(actor, "Created Office Request", { requestId: newRequest.id, department: request.department });
  return newRequest;
}

export async function updateOfficeRequestAction(
  requestId: string,
  updates: Partial<OfficeRequest>,
  actor: { name: string; email: string; roles: string[] }
): Promise<void> {
  await updateOfficeRequest(requestId, updates);
  await logAction(actor, "Updated Office Request", { requestId, updates });
}

export async function deleteOfficeRequestAction(
  requestId: string,
  actor: { name: string; email: string; roles: string[] }
): Promise<void> {
  await deleteOfficeRequest(requestId);
  await logAction(actor, "Deleted Office Request", { requestId });
}

