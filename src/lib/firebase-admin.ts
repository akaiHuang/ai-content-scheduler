import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | undefined;

export function getAdminApp() {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Will be initialized by storage.ts
  throw new Error("Firebase Admin not initialized");
}

export function getDb() {
  return getFirestore(getAdminApp());
}

export interface UserInstagramData {
  instagramUserId: string;
  accessToken: string;
  tokenExpiry?: number;
  username?: string;
  profilePicture?: string;
  updatedAt: number;
}
