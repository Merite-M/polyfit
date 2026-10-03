/**
 * PolyFit Corporate Employee App - 100% Offline Cryptographic Vault
 * Secure token seed caching, local visit queuing, and automatic background sync
 * Compliant with expo-native-ui and SecureStore standards
 */

import { Platform } from 'react-native';

const STORAGE_KEY_SEED = 'polyfit_offline_pass_seed';
const STORAGE_KEY_SEED_METADATA = 'polyfit_seed_metadata';
const STORAGE_KEY_OFFLINE_VISITS = 'polyfit_offline_visits_queue';

export interface CachedSeedMetadata {
  employeeId: string;
  orgId: string;
  stepSeconds: number;
  validUntil: string;
  issuedAt: number;
}

export interface QueuedOfflineVisit {
  id: string;
  employeeId: string;
  providerLocationId: string;
  providerLocationName: string;
  scannedAt: string;
  totpToken: string;
  lat?: number | null;
  lng?: number | null;
  synced: boolean;
}

// Storage helpers
async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    console.warn('[OfflineVault] getStorageItem error:', err);
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn('[OfflineVault] setStorageItem error:', err);
  }
}

export class OfflineVaultService {
  /**
   * Save 24-hour cryptographic token seed securely
   */
  static async saveTokenSeed(seed: string, metadata: CachedSeedMetadata): Promise<void> {
    await setStorageItem(STORAGE_KEY_SEED, seed);
    await setStorageItem(STORAGE_KEY_SEED_METADATA, JSON.stringify(metadata));
  }

  /**
   * Retrieve cached cryptographic seed
   */
  static async getTokenSeed(): Promise<string | null> {
    return await getStorageItem(STORAGE_KEY_SEED);
  }

  /**
   * Retrieve metadata for the cached seed
   */
  static async getSeedMetadata(): Promise<CachedSeedMetadata | null> {
    const raw = await getStorageItem(STORAGE_KEY_SEED_METADATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Check if the offline vault has a valid, non-expired seed
   */
  static async isVaultActive(): Promise<boolean> {
    const seed = await this.getTokenSeed();
    if (!seed) return false;
    const meta = await this.getSeedMetadata();
    if (!meta || !meta.validUntil) return true; // valid fallback
    return new Date(meta.validUntil).getTime() > Date.now();
  }

  /**
   * Queue an offline check-in (Modality B) when cellular signal is absent
   */
  static async queueOfflineVisit(visit: Omit<QueuedOfflineVisit, 'id' | 'synced'>): Promise<QueuedOfflineVisit> {
    const queue = await this.getOfflineQueue();
    const newVisit: QueuedOfflineVisit = {
      ...visit,
      id: `off_vis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      synced: false,
    };
    queue.push(newVisit);
    await setStorageItem(STORAGE_KEY_OFFLINE_VISITS, JSON.stringify(queue));
    return newVisit;
  }

  /**
   * Retrieve pending offline visits queue
   */
  static async getOfflineQueue(): Promise<QueuedOfflineVisit[]> {
    const raw = await getStorageItem(STORAGE_KEY_OFFLINE_VISITS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Clear or remove synced visits from queue
   */
  static async markVisitsSynced(ids: string[]): Promise<void> {
    const queue = await this.getOfflineQueue();
    const remaining = queue.filter((v) => !ids.includes(v.id));
    await setStorageItem(STORAGE_KEY_OFFLINE_VISITS, JSON.stringify(remaining));
  }

  /**
   * Flushes offline queue to backend if network connectivity is restored
   */
  static async syncOfflineVisits(apiBaseUrl: string, token: string): Promise<number> {
    const queue = await this.getOfflineQueue();
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const successfullySyncedIds: string[] = [];

    for (const visit of queue) {
      try {
        const res = await fetch(`${apiBaseUrl}/api/employee/scan-plaque`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider_location_id: visit.providerLocationId,
            employee_id: visit.employeeId,
            lat: visit.lat,
            lng: visit.lng,
            offline_token: visit.totpToken,
            scanned_at: visit.scannedAt,
          }),
        });

        if (res.ok) {
          successfullySyncedIds.push(visit.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn('[OfflineVault] Sync failed for visit:', visit.id, err);
      }
    }

    if (successfullySyncedIds.length > 0) {
      await this.markVisitsSynced(successfullySyncedIds);
    }

    return syncedCount;
  }
}
