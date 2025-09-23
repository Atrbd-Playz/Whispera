// Node script to send a test push to subscriptions stored in .next/data/push_subscriptions.json
// Usage: node scripts/send-push-test.js --title "Hi" --body "Test"

const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const DATA_DIR = path.join(process.cwd(), '.next', 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { title: 'Test', body: 'Hello from local test', url: '/chats' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--title' && argv[i + 1]) out.title = argv[++i];
    if (a === '--body' && argv[i + 1]) out.body = argv[++i];
    if (a === '--url' && argv[i + 1]) out.url = argv[++i];
  }
  return out;
}

(async () => {
  const args = parseArgs();
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const mailto = process.env.VAPID_MAILTO || 'mailto:example@example.com';
  if (!publicKey || !privateKey) {
    console.error('Missing VAPID keys in env. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
    process.exit(1);
  }
  webpush.setVapidDetails(mailto, publicKey, privateKey);

  let subs = [];
  try {
    subs = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')) || [];
  } catch (e) {
    console.error('Failed to read subscriptions file:', SUBS_FILE, e.message || e);
    process.exit(1);
  }

  if (!subs.length) {
    console.error('No subscriptions found in', SUBS_FILE);
    process.exit(1);
  }

  const payload = JSON.stringify({ title: args.title, body: args.body, url: args.url, options: { body: args.body, data: { url: args.url } } });

  for (const sub of subs) {
    try {
      const res = await webpush.sendNotification(sub, payload);
      console.log('Sent to', sub.endpoint, 'status', res.statusCode);
    } catch (err) {
      console.error('Failed to send to', sub.endpoint, err?.statusCode || err);
    }
  }
})();
