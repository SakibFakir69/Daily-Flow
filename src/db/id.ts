import * as Crypto from 'expo-crypto';

/**
 * Generates a new RFC4122 v4 UUID string used as a primary key across the app.
 * String UUIDs (rather than autoincrement integers) keep export/import and any
 * future cross-device merge collision-safe. `randomUUID` is synchronous in SDK 56.
 */
export function newId(): string {
  return Crypto.randomUUID();
}
