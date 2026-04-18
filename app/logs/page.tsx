'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  time: string;
  level: 'error' | 'info' | 'debug' | 'warn';
  msg: string;
  [key: string]: unknown;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('logsPassword');
    if (savedPassword) {
      // eslint-disable-next-line
      setPassword(savedPassword);
      setIsAuthenticated(true);
      setShowModal(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsUnlocking(true);
    setError('');

    // Simulate slow motion unlock (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));

    localStorage.setItem('logsPassword', password);
    setIsAuthenticated(true);
    setShowModal(false);
    setIsUnlocking(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('logsPassword');
    setPassword('');
    setIsAuthenticated(false);
    setShowModal(true);
    setLogs([]);
  };

  const refreshLogs = () => {
    const currentPassword = localStorage.getItem('logsPassword');
    if (!currentPassword) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    fetch(`/api/logs?secret=${currentPassword}&level=${level}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setShowModal(true);
            localStorage.removeItem('logsPassword');
            throw new Error('Invalid password');
          }
          throw new Error('Failed to fetch logs');
        }
        return res.json();
      })
      .then(data => {
        let filtered = data.logs || [];
        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter((log: LogEntry) => 
            log.msg?.toLowerCase().includes(q) ||
            JSON.stringify(log).toLowerCase().includes(q)
          );
        }
        setLogs(filtered);
        setError('');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // eslint-disable-next-line
    refreshLogs();
    const interval = setInterval(() => refreshLogs(), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, level, query]);

  const errorCount = logs.filter(l => l.level === 'error').length;
  const infoCount = logs.filter(l => l.level === 'info').length;
  const debugCount = logs.filter(l => l.level === 'debug').length;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'debug': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'warn': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  // Password Modal
  if (showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <div 
          className="w-full max-w-md p-8 rounded-2xl"
          style={{ 
            background: 'var(--background-elevated)', 
            border: '2px solid var(--border-default)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Admin Access
            </h1>
            <p style={{ color: 'var(--foreground-muted)' }}>
              Enter password to view application logs
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                autoFocus
                disabled={isUnlocking}
                className="w-full px-4 py-3 rounded-xl text-center text-lg transition-all"
                style={{ 
                  background: 'var(--background-card)', 
                  border: isUnlocking ? '2px solid var(--accent-primary)' : '2px solid var(--border-default)',
                  color: 'var(--foreground)',
                  opacity: isUnlocking ? 0.7 : 1
                }}
              />
              {isUnlocking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            {error && (
              <div 
                className="p-3 rounded-lg text-sm text-center"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isUnlocking || !password.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ background: 'var(--accent-primary)' }}
            >
              {isUnlocking ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Unlocking...
                </span>
              ) : (
                '🔓 Unlock'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                📋 Application Logs
              </h1>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
            >
              🚪 Logout
            </button>
          </div>
          <p style={{ color: 'var(--foreground-muted)' }}>
            Monitor your application activity in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Total" 
            value={logs.length} 
            color="#10b981" 
            icon="📊"
          />
          <StatCard 
            label="Errors" 
            value={errorCount} 
            color="#ef4444" 
            icon="🔴"
          />
          <StatCard 
            label="Info" 
            value={infoCount} 
            color="#3b82f6" 
            icon="🔵"
          />
          <StatCard 
            label="Debug" 
            value={debugCount} 
            color="#64748b" 
            icon="⚪"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl"
             style={{ background: 'var(--background-elevated)', border: '1px solid var(--border-default)' }}>
          <FilterButton active={level === 'all'} onClick={() => setLevel('all')}>
            All
          </FilterButton>
          <FilterButton active={level === 'error'} onClick={() => setLevel('error')} color="red">
            🔴 Errors
          </FilterButton>
          <FilterButton active={level === 'info'} onClick={() => setLevel('info')} color="blue">
            🔵 Info
          </FilterButton>
          <FilterButton active={level === 'debug'} onClick={() => setLevel('debug')} color="gray">
            ⚪ Debug
          </FilterButton>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search logs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{ 
                background: 'var(--background-card)', 
                border: '2px solid var(--border-default)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          <button
            onClick={() => refreshLogs()}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent-primary)' }}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl mb-6 flex items-center gap-3"
               style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)' }}>
            <span className="text-2xl">⚠️</span>
            <span style={{ color: 'var(--accent-danger)' }}>{error}</span>
          </div>
        )}

        {/* Logs List */}
        <div className="rounded-xl overflow-hidden"
             style={{ background: 'var(--background-elevated)', border: '1px solid var(--border-default)' }}>
          {logs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-6xl mb-4">📄</div>
              <p style={{ color: 'var(--foreground-muted)' }}>No logs found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-muted)' }}>
              {logs.slice(0, 100).map((log, index) => (
                <div 
                  key={index} 
                  className="p-4 hover:brightness-110 transition-all"
                  style={{ background: 'var(--background-elevated)' }}
                >
                  <div className="flex items-start gap-4">
                    {/* Level Badge */}
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs mb-1" style={{ color: 'var(--foreground-muted)' }}>
                        {new Date(log.time).toLocaleString()}
                      </div>
                      <div className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                        {log.msg}
                      </div>
                      
                      {/* Extra Data */}
                      {Object.entries(log)
                        .filter(([key]) => !['time', 'level', 'msg'].includes(key))
                        .length > 0 && (
                        <div 
                          className="p-3 rounded-lg text-xs font-mono overflow-x-auto"
                          style={{ background: 'var(--background-card)', color: 'var(--foreground-subtle)' }}
                        >
                          {Object.entries(log)
                            .filter(([key]) => !['time', 'level', 'msg'].includes(key))
                            .map(([key, val]) => (
                              <div key={key} className="mb-1">
                                <span style={{ color: 'var(--foreground-muted)' }}>{key}:</span>{' '}
                                <span style={{ color: 'var(--foreground)' }}>{JSON.stringify(val)}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Showing {Math.min(logs.length, 100)} of {logs.length} entries • Auto-refresh every 10s
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div 
      className="p-4 rounded-xl text-center"
      style={{ 
        background: 'var(--background-elevated)', 
        border: '1px solid var(--border-default)',
        borderLeft: `4px solid ${color}`
      }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
        {label}
      </div>
    </div>
  );
}

function FilterButton({ 
  children, 
  active, 
  onClick, 
  color = 'green' 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  color?: 'green' | 'red' | 'blue' | 'gray';
}) {
  const colors = {
    green: active ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-emerald-500/20 hover:text-emerald-400',
    red: active ? 'bg-red-500 text-white border-red-500' : 'hover:bg-red-500/20 hover:text-red-400',
    blue: active ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-blue-500/20 hover:text-blue-400',
    gray: active ? 'bg-slate-500 text-white border-slate-500' : 'hover:bg-slate-500/20 hover:text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border border-transparent ${colors[color]}`}
      style={{ 
        background: active ? undefined : 'var(--background-card)',
        color: active ? undefined : 'var(--foreground)'
      }}
    >
      {children}
    </button>
  );
}
