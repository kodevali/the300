
'use server';

import { getRoles as getRolesStorage, saveRoles as saveRolesStorage, type Roles } from '@/lib/local-storage';

/**
 * Retrieves role configurations from local storage.
 * @returns A promise that resolves to a record of LOBs and their roles.
 */
export async function getRoles(): Promise<Record<string, Roles>> {
  try {
    return await getRolesStorage();
  } catch (error) {
    console.error("Error fetching roles from local storage: ", error);
    throw new Error("Failed to fetch roles from local storage.");
  }
}

/**
 * Saves the entire role configuration object to local storage.
 * This will overwrite the existing configuration.
 * @param roles - A record of LOBs and their assigned roles.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveRoles(roles: Record<string, Roles>): Promise<void> {
  try {
    await saveRolesStorage(roles);
    console.log('Successfully saved role configuration to local storage.');
  } catch (error) {
    console.error("Error saving roles to local storage: ", error);
    throw new Error("Failed to save roles.");
  }
}
