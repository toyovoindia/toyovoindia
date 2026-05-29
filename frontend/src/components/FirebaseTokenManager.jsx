import { useEffect } from 'react';
import { requestForToken, onForegroundMessage } from '../config/firebase';
import { saveFcmToken } from '../services/notificationApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const FirebaseTokenManager = () => {
  const { user } = useAuth();
  const { success } = useToast();

  useEffect(() => {
    if (!user) return;

    const setupFCM = async () => {
      try {
        const token = await requestForToken();
        if (token) {
          console.log('[FCM] Token synced:', token);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'web';
          await saveFcmToken(token, isMobile);
        }
      } catch (error) {
        console.error('[FCM] Setup error:', error);
      }
    };

    setupFCM();
  }, [user]);

  useEffect(() => {
    // foreground listener
    const unsubscribe = onForegroundMessage(async (payload) => {
      console.log('[FCM] Foreground Message Received:', payload);
      
      const title = payload.notification?.title || 'Toyovo India';
      const body = payload.notification?.body || '';

      // 1. Show UI Toast (Internal)
      success(`${title}: ${body}`);
    });

    return () => unsubscribe();
  }, [success]);

  return null;
};
