'use client';

import type { ScanResult, SecurityFinding } from '@/app/types/scan';
import { motion } from 'motion/react';
import { GradeBadge } from './GradeBadge';
import { FindingCard } from './FindingCard';

interface ResultsDashboardProps {
  result: ScanResult;
  onReset: () => void;
}

function groupFindingsByCategory(findings: SecurityFinding[]) {
  const groups: Record<string, SecurityFinding[]> = {
    headers: [],
    dns: [],
    ssl: [],
    general: [],
    performance: [],
    pentest: [],
    vulnerability: [],
  };
  
  for (const finding of findings) {
    const category = finding.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(finding);
  }
  
  return groups;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const groupedFindings = groupFindingsByCategory(result.findings);
  
  const goodFindings = result.findings.filter(f => f.severity === 'good');
  const warningFindings = result.findings.filter(f => f.severity === 'warning');
  const badFindings = result.findings.filter(f => f.severity === 'bad');

  return (
    <motion.div 
      className="w-full max-w-5xl space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm"
      >
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">{result.domain}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Scanned in {result.duration}ms • {new Date(result.scanTime).toLocaleString()}
          </p>
        </div>
        <GradeBadge grade={result.grade} score={result.score} />
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center backdrop-blur-sm"
        >
          <p className="text-3xl font-bold text-emerald-400">{goodFindings.length}</p>
          <p className="text-sm text-zinc-400 mt-1">Passed</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-center backdrop-blur-sm"
        >
          <p className="text-3xl font-bold text-yellow-400">{warningFindings.length}</p>
          <p className="text-sm text-zinc-400 mt-1">Warnings</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center backdrop-blur-sm"
        >
          <p className="text-3xl font-bold text-red-400">{badFindings.length}</p>
          <p className="text-sm text-zinc-400 mt-1">Issues</p>
        </motion.div>
      </motion.div>

      {/* Findings by Category */}
      <div className="space-y-6">
        {/* SSL/TLS Section */}
        {groupedFindings.ssl.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              SSL/TLS Certificate
            </h3>
            <div className="space-y-3">
              {groupedFindings.ssl.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* HTTP Headers Section */}
        {groupedFindings.headers.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              HTTP Security Headers
            </h3>
            <div className="space-y-3">
              {groupedFindings.headers.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* DNS Records Section */}
        {groupedFindings.dns.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              DNS Email Security
            </h3>
            <div className="space-y-3">
              {groupedFindings.dns.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* General Section */}
        {groupedFindings.general.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM8.25 9.75h.008v.008H8.25V9.75zm0 3h.008v.008H8.25V12.75z" />
              </svg>
              Other Findings
            </h3>
            <div className="space-y-3">
              {groupedFindings.general.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Performance Section */}
        {groupedFindings.performance.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Performance Metrics
            </h3>
            <div className="space-y-3">
              {groupedFindings.performance.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pentest Section */}
        {groupedFindings.pentest.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.164 4.177l1.591-1.591M6 10.5H3.75m15.364 7.5l1.591 1.591M12 18V20.25" />
              </svg>
              Penetration Test Findings
            </h3>
            <div className="space-y-3">
              {groupedFindings.pentest.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Vulnerability Section */}
        {groupedFindings.vulnerability.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Vulnerabilities
            </h3>
            <div className="space-y-3">
              {groupedFindings.vulnerability.map((finding, index) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FindingCard finding={finding} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Findings Summary */}
        {result.findings.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
            <h3 className="mb-4 text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              All Findings ({result.findings.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.findings.map((finding, index) => (
                <motion.div
                  key={`${finding.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border text-sm ${
                    finding.severity === 'good' ? 'border-emerald-500/30 bg-emerald-500/10' :
                    finding.severity === 'warning' ? 'border-yellow-500/30 bg-yellow-500/10' :
                    finding.severity === 'bad' ? 'border-red-500/30 bg-red-500/10' :
                    finding.severity === 'critical' ? 'border-red-600/50 bg-red-600/20' :
                    'border-zinc-700/50 bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-medium ${
                      finding.severity === 'good' ? 'text-emerald-400' :
                      finding.severity === 'warning' ? 'text-yellow-400' :
                      finding.severity === 'bad' ? 'text-red-400' :
                      finding.severity === 'critical' ? 'text-red-400' :
                      'text-zinc-400'
                    }`}>
                      {finding.severity === 'good' ? '✓' :
                       finding.severity === 'warning' ? '⚠' :
                       finding.severity === 'bad' ? '✗' :
                       finding.severity === 'critical' ? '!' : '•'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-200">{finding.title}</p>
                      <p className="text-zinc-400 text-xs mt-1">{finding.description}</p>
                      {finding.details && (
                        <p className="text-zinc-500 text-xs mt-1 font-mono">{finding.details}</p>
                      )}
                      {finding.recommendation && (
                        <p className="text-emerald-400 text-xs mt-1">Fix: {finding.recommendation}</p>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 uppercase">{finding.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Raw Data Toggle */}
      <motion.details 
        variants={itemVariants}
        className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden group"
      >
        <summary className="cursor-pointer p-4 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-between">
          <span>View Raw Scan Data</span>
          <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="border-t border-zinc-800/50 p-4">
          <pre className="overflow-x-auto text-xs text-zinc-500 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </motion.details>

      {/* Reset Button */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-8 py-4 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 backdrop-blur-sm"
        >
          Scan Another Domain
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
