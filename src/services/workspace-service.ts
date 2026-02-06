
'use server';

import { getUsers, saveUsers, updateUser as updateUserStorage, removeUser as removeUserStorage, removeAllUsers as removeAllUsersStorage, clearAllSelections as clearAllSelectionsStorage, type User } from '@/lib/local-storage';

/**
 * Retrieves cached users from local storage.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getCachedUsers(): Promise<User[]> {
  try {
    return await getUsers();
  } catch (error: any) {
    console.error("Error fetching users from local storage: ", error.message);
    throw error;
  }
}

/**
 * Caches an array of users in local storage.
 * The user's ID is used as the document ID.
 * @param users - An array of User objects to cache.
 * @returns A promise that resolves when the caching is complete.
 */
export async function cacheUsers(users: User[]): Promise<void> {
  if (users.length === 0) {
    return;
  }

  try {
    const existingUsers = await getUsers();
    const userMap = new Map(existingUsers.map(u => [u.id, u]));
    
    // Merge new users with existing ones
    users.forEach((user) => {
      if (!user.id) {
        console.warn(`Skipping user with no ID: ${user.name}`);
        return;
      }
      userMap.set(user.id, { ...userMap.get(user.id), ...user });
    });
    
    await saveUsers(Array.from(userMap.values()));
    console.log(`Successfully cached/updated ${users.length} users in local storage.`);
  } catch (error) {
    console.error("Error caching users to local storage: ", error);
    throw new Error("Failed to cache users.");
  }
}

/**
 * Updates a single user document in local storage.
 * The user's ID is used as the document ID.
 * If reason is undefined, it will be removed from the document, but modifier will be kept.
 * @param user - The User object to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateUser(user: User): Promise<void> {
  if (!user.id) {
    throw new Error("Cannot update user without an ID.");
  }
  try {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
      const existingUser = users[index];
      const updatedUser: User = {
        ...existingUser,
        ...user,
        modifiedAt: new Date().toISOString(),
      };
      
      // If reason is explicitly undefined, remove it
      if (user.reason === undefined) {
        delete updatedUser.reason;
      }
      
      users[index] = updatedUser;
    } else {
      users.push({
        ...user,
        modifiedAt: new Date().toISOString(),
      });
    }
    
    await saveUsers(users);
    console.log(`Successfully updated user ${user.id} in local storage.`);
  } catch (error) {
    console.error(`Error updating user ${user.id} in local storage:`, error);
    throw new Error("Failed to update user selection.");
  }
}

/**
 * Removes a single user from local storage by their ID.
 * @param id - The ID of the user to remove.
 * @returns A promise that resolves when the user has been removed.
 */
export async function removeUser(id: string): Promise<void> {
  if (!id) {
    throw new Error("ID is required to remove a user.");
  }

  try {
    await removeUserStorage(id);
    console.log(`Successfully removed user ${id} from local storage.`);
  } catch (error) {
    console.error(`Error removing user ${id}:`, error);
    throw new Error("Failed to remove user.");
  }
}


/**
 * Removes all users from local storage.
 * @returns A promise that resolves when all users have been removed.
 */
export async function removeAllUsers(): Promise<void> {
    try {
        await removeAllUsersStorage();
        console.log(`Successfully removed all users.`);
    } catch (error) {
        console.error("Error removing all users:", error);
        throw new Error("Failed to remove all users.");
    }
}

/**
 * Clears the 'modifier' and 'reason' fields for all users in local storage.
 * @returns A promise that resolves when all selections have been cleared.
 */
export async function clearAllSelections(): Promise<void> {
    try {
        await clearAllSelectionsStorage();
        const users = await getUsers();
        console.log(`Successfully cleared selections for ${users.length} users.`);
    } catch (error) {
        console.error("Error clearing all selections:", error);
        throw new Error("Failed to clear all selections.");
    }
}
