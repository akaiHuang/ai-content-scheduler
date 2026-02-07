import { randomUUID } from "node:crypto";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "./env";

let firebaseApp: App;

function getFirebaseApp() {
  if (!firebaseApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      });
    }
  }
  return firebaseApp;
}

export async function uploadBuffer(
  buffer: Buffer,
  options: {
    contentType: string;
    prefix?: string;
    ext: string;
  },
) {
  const filename = `${options.prefix ?? "generated"}/${randomUUID()}.${options.ext}`;

  const app = getFirebaseApp();
  const bucket = getStorage(app).bucket();
  const file = bucket.file(filename);

  await file.save(buffer, {
    contentType: options.contentType,
    metadata: {
      cacheControl: "public, max-age=31536000",
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${filename}`;
}
