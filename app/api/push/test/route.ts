import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import webpush from '@/lib/webpush';

const DATA_DIR = path.join(process.cwd(), '.next', 'data');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

async function readSubs(): Promise<any[]> {
  try {
    const buf = await fs.readFile(SUBS_FILE, 'utf8');
    return JSON.parse(buf);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title = 'New message', body: text = 'Hello from push', url = '/chats', icon = '/favicon.ico' } = body || {};

    const payload = JSON.stringify({ title, body: text, icon, url, options: { body: text, icon, data: { url } } });

    const subs = await readSubs();
    const results: any[] = [];
    const removals: any[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const res = await webpush.sendNotification(sub, payload);
          results.push({ endpoint: sub.endpoint, statusCode: res.statusCode });
        } catch (err: any) {
          const statusCode = err?.statusCode;
          results.push({ endpoint: sub.endpoint, error: String(err), statusCode });
          if (statusCode === 404 || statusCode === 410) {
            removals.push(sub.endpoint);
          }
        }
      })
    );

    if (removals.length) {
      try {
        const remaining = subs.filter((s) => !removals.includes(s.endpoint));
        const fs2 = await import('fs/promises');
        await fs2.writeFile(SUBS_FILE, JSON.stringify(remaining, null, 2), 'utf8');
      } catch {}
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
  }
}
