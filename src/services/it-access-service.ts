
'use server';

import { 
  getITAccessFeatures as getITAccessFeaturesStorage, 
  saveITAccessFeatures as saveITAccessFeaturesStorage,
  updateITAccessFeature as updateITAccessFeatureStorage,
  getOfficeRequests as getOfficeRequestsStorage,
  createOfficeRequest as createOfficeRequestStorage,
  updateOfficeRequest as updateOfficeRequestStorage,
  deleteOfficeRequest as deleteOfficeRequestStorage,
  type ITAccessFeature,
  type OfficeRequest
} from '@/lib/local-storage';

/**
 * Retrieves all IT access features from local storage.
 * @returns A promise that resolves to an array of ITAccessFeature objects.
 */
export async function getITAccessFeatures(): Promise<ITAccessFeature[]> {
  try {
    return await getITAccessFeaturesStorage();
  } catch (error) {
    console.error("Error fetching IT access features from local storage: ", error);
    throw new Error("Failed to fetch IT access features.");
  }
}

/**
 * Saves the list of IT access features to local storage.
 * @param features - An array of ITAccessFeature objects.
 * @returns A promise that resolves when the save is complete.
 */
export async function saveITAccessFeatures(features: ITAccessFeature[]): Promise<void> {
  try {
    await saveITAccessFeaturesStorage(features);
    console.log('Successfully saved IT access features to local storage.');
  } catch (error) {
    console.error("Error saving IT access features to local storage: ", error);
    throw new Error("Failed to save IT access features.");
  }
}

/**
 * Updates a single IT access feature.
 * @param featureId - The ID of the feature to update.
 * @param updates - Partial feature object with fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateITAccessFeature(featureId: string, updates: Partial<ITAccessFeature>): Promise<void> {
  try {
    await updateITAccessFeatureStorage(featureId, updates);
    console.log(`Successfully updated IT access feature ${featureId}.`);
  } catch (error) {
    console.error(`Error updating IT access feature ${featureId}:`, error);
    throw new Error("Failed to update IT access feature.");
  }
}

/**
 * Retrieves all office requests from local storage.
 * @returns A promise that resolves to an array of OfficeRequest objects.
 */
export async function getOfficeRequests(): Promise<OfficeRequest[]> {
  try {
    return await getOfficeRequestsStorage();
  } catch (error) {
    console.error("Error fetching office requests from local storage: ", error);
    throw new Error("Failed to fetch office requests.");
  }
}

/**
 * Creates a new office request.
 * @param request - The office request data (without id, requestedAt, status).
 * @returns A promise that resolves to the created OfficeRequest.
 */
export async function createOfficeRequest(request: Omit<OfficeRequest, 'id' | 'requestedAt' | 'status'>): Promise<OfficeRequest> {
  try {
    return await createOfficeRequestStorage(request);
  } catch (error) {
    console.error("Error creating office request: ", error);
    throw new Error("Failed to create office request.");
  }
}

/**
 * Updates an existing office request.
 * @param requestId - The ID of the request to update.
 * @param updates - Partial request object with fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateOfficeRequest(requestId: string, updates: Partial<OfficeRequest>): Promise<void> {
  try {
    await updateOfficeRequestStorage(requestId, updates);
    console.log(`Successfully updated office request ${requestId}.`);
  } catch (error) {
    console.error(`Error updating office request ${requestId}:`, error);
    throw new Error("Failed to update office request.");
  }
}

/**
 * Deletes an office request.
 * @param requestId - The ID of the request to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteOfficeRequest(requestId: string): Promise<void> {
  try {
    await deleteOfficeRequestStorage(requestId);
    console.log(`Successfully deleted office request ${requestId}.`);
  } catch (error) {
    console.error(`Error deleting office request ${requestId}:`, error);
    throw new Error("Failed to delete office request.");
  }
}

