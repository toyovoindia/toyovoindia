import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD5vHgsmPBJ9-elOMgzEcRvhEd2ctiXMWk",
  authDomain: "toyovoindia-95fde.firebaseapp.com",
  projectId: "toyovoindia-95fde",
  storageBucket: "toyovoindia-95fde.firebasestorage.app",
  messagingSenderId: "614606970846",
  appId: "1:614606970846:web:0816f8864e7a0063d2874f"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const requestFirebaseToken = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging);
      return token;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
