
'use server';

import { getConsolidatedViewUsers as getConsolidatedViewUsersStorage, saveConsolidatedViewUsers as saveConsolidatedViewUsersStorage } from '@/lib/local-storage';

/**
 * Retrieves the list of user emails with consolidated view access from local storage.
 * @returns A promise that resolves to an array of user email strings.
 */
export async function getConsolidatedViewUsers(): Promise<string[]> {
  try {
    return await getConsolidatedViewUsersStorage();
  } catch (error) {
    console.error("Error fetching consolidated view users from local storage: ", error);
    throw new Error("Failed to fetch consolidated view access configuration.");
  }
}

/**
 * Saves the list of user emails with consolidated view access to local storage.
 * This will overwrite the existing list.
 * @param userEmails - An array of user email strings.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveConsolidatedViewUsers(userEmails: string[]): Promise<void> {
  try {
    await saveConsolidatedViewUsersStorage(userEmails);
    console.log('Successfully saved consolidated view user list to local storage.');
  } catch (error) {
    console.error("Error saving consolidated view users to local storage: ", error);
    throw new Error("Failed to save consolidated view access configuration.");
  }
}
