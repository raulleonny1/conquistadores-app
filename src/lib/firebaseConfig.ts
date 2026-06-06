import raw from "../../firebase.config.json";

export const firebaseConfig = {
  apiKey: raw.apiKey,
  authDomain: raw.authDomain,
  projectId: raw.projectId,
  storageBucket: raw.storageBucket,
  messagingSenderId: raw.messagingSenderId,
  appId: raw.appId,
} as const;

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
