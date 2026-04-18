import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_SECRET = process.env.LOG_SECRET || 'admin-logs-secret';

interface LogEntry {
  time: string;
  level: string;
  msg: string;
  [key: string]: unknown;
}

function parseLogFile(filePath: string): LogEntry[] {
  if (!existsSync(filePath)) {
    return [];
  }
  
  const content = readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { time: new Date().toISOString(), level: 'unknown', msg: line };
      }
    })
    .reverse(); // Most recent first
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== LOG_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const logsDir = join(process.cwd(), 'logs');
  const level = searchParams.get('level') || 'all';
  const query = searchParams.get('query')?.toLowerCase() || '';
  
  let logs: LogEntry[] = [];
  
  if (level !== 'all' && ['info', 'error', 'debug'].includes(level)) {
    logs = parseLogFile(join(logsDir, `${level}.log`));
  } else {
    logs = [
      ...parseLogFile(join(logsDir, 'error.log')),
      ...parseLogFile(join(logsDir, 'info.log')),
      ...parseLogFile(join(logsDir, 'debug.log')),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  // Filter by search query
  if (query) {
    logs = logs.filter(log => 
      log.msg?.toLowerCase().includes(query) ||
      JSON.stringify(log).toLowerCase().includes(query)
    );
  }

  return NextResponse.json({ 
    logs: logs.slice(0, 100), 
    count: logs.length, 
    level,
    accessedAt: new Date().toISOString()
  });
}
