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
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid unsubscribe request' }, { status: 400 });
    }
    const subs = await readSubs();
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    await writeSubs(filtered);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
