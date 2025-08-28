import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const mailto = process.env.VAPID_MAILTO || 'mailto:example@example.com';

if (!publicKey || !privateKey) {
  console.warn('[webpush] Missing VAPID keys. Push notifications will not work.');
} else {
  try {
    webpush.setVapidDetails(mailto, publicKey, privateKey);
  } catch (e) {
    console.error('[webpush] Failed to set VAPID details', e);
  }
}

export default webpush;
