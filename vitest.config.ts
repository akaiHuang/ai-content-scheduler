import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      OPENAI_API_KEY: "sk-test",
      FIREBASE_PROJECT_ID: "test-project",
      FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
      FIREBASE_SERVICE_ACCOUNT_KEY:
        '{"type":"service_account","project_id":"test"}',
      FIREBASE_API_KEY: "AIzaSyTest",
      FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
      INSTAGRAM_APP_ID: "test-app-id",
      INSTAGRAM_APP_SECRET: "test-app-secret",
      INSTAGRAM_GRAPH_API_VERSION: "v21.0",
      SESSION_SECRET: "test-secret-key-at-least-32-characters-long",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
