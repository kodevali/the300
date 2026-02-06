
'use server';

import { getNotificationConfig as getNotificationConfigStorage, saveNotificationConfig as saveNotificationConfigStorage } from '@/lib/local-storage';

// Store recipients as an array of strings (keywords or email addresses)
export interface NotificationConfig {
    to: string[]; 
    cc: string[];
    bcc: string[];
}

/**
 * Retrieves the email notification configuration from local storage.
 * @returns A promise that resolves to the notification configuration.
 */
export async function getNotificationConfig(): Promise<NotificationConfig> {
  try {
    const config = await getNotificationConfigStorage();
    // If config is empty, return defaults
    if (!config.to.length && !config.cc.length && !config.bcc.length) {
      return { to: ["<GROUP_HEAD>"], cc: ["<DELEGATES>"], bcc: ["<ADMINS>"] };
    }
    return config;
  } catch (error) {
    console.error("Error fetching notification config from local storage: ", error);
    throw new Error("Failed to fetch notification configuration.");
  }
}

/**
 * Saves the email notification configuration to local storage.
 * This will overwrite the existing configuration.
 * @param config - The notification configuration object.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  try {
    await saveNotificationConfigStorage(config);
    console.log('Successfully saved notification configuration to local storage.');
  } catch (error) {
    console.error("Error saving notification config to local storage: ", error);
    throw new Error("Failed to save notification configuration.");
  }
}
