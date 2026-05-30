import admin from 'firebase-admin';
import env from './env.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let firebaseApp = null;

export const initializeFirebase = () => {
  try {
    if (firebaseApp) return firebaseApp;

    let serviceAccount = null;
    
    // 1. Try to load from YOUR specific JSON file (The one you just showed me)
    const officialJsonPath = path.join(__dirname, 'toyovoindia-95fde-firebase-adminsdk-fbsvc-b5389db6ae.json');
    const backupJsonPath = path.join(__dirname, 'firebase-service-account.json');
    
    const jsonPath = fs.existsSync(officialJsonPath) ? officialJsonPath : backupJsonPath;

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        serviceAccount = JSON.parse(raw);
        logger.info(`FCM: Successfully loaded from ${path.basename(jsonPath)}`);
      } catch (err) {
        logger.error(`FCM: Error parsing JSON file at ${jsonPath}`, {
          message: err.message
        });
      }
    }

    // 2. Fallback to ENV (Only if JSON file fails)
    if (!serviceAccount && env.FIREBASE_CONFIG) {
      try {
        let configStr = env.FIREBASE_CONFIG.trim();
        configStr = configStr.replace(/^['"]|['"]$/g, '');
        serviceAccount = JSON.parse(configStr);
      } catch (err) {
        logger.error(`FCM: Error parsing FIREBASE_CONFIG env variable: ${err.message}`);
      }
    }

    if (!serviceAccount) {
      logger.error('FCM: CRITICAL - No valid service account configuration found. Notifications will NOT work.');
      return null;
    }

    // Ensure the private key has correct newlines (Firebase is very picky about this)
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    logger.info('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase Admin initialization failed', error);
    return null;
  }
};

export const getMessaging = () => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp ? admin.messaging() : null;
};

export default firebaseApp;
