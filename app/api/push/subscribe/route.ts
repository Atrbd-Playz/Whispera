import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

async function writeSubs(subs: any[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), 'utf8');
}

export async function POST(req: NextRequest) {
  try {
    const sub = await req.json();
    if (!sub || !sub.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }
    const subs = await readSubs();
    const exists = subs.find((s) => s.endpoint === sub.endpoint);
    if (!exists) subs.push(sub);
    await writeSubs(subs);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
