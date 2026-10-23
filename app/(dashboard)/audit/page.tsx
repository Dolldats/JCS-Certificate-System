'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { auditApi } from '../../../services/api';
import { AuditLog, Auxiliary } from '../../../types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import {
  ClipboardList,
  Search,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';

export default function AuditPage() {
  const { activeAuxiliary, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  // Server-side paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const loadLogs = async () => {
    if (user?.role !== 'SUPER_ADMIN') return;
    setLoading(true);
    const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
    try {
      // One page at a time, filtered by the server.
      const result = await auditApi.getLogsPage({
        page,
        pageSize,
        search: searchQuery.trim() || undefined,
        action: actionFilter === 'all' ? undefined : actionFilter,
        auxiliary: aux,
      });
      setLogs(result.items);
      setTotalCount(result.totalCount);
    } catch (error) {
      // The server is unreachable — show the cached trail and notify the user.
      console.warn('Could not load the activity log from the server:', error);
      const { logs: cached, stale } = await auditApi.getLogsWithStatus(aux);
      setLogs(cached);
      setTotalCount(cached.length);
      if (stale) {
        toast.info(
          'The server could not be reached, so these are the last locally cached records. They may not reflect the latest activity. Refresh once the connection is restored.',
          { title: 'Showing cached entries', duration: 8000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    // Fetch in an async task (not synchronously in the effect body) so the
    // initial server/client render stays consistent and lint-safe.
    let cancelled = false;
    (async () => {
      setLoading(true);
      const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
      try {
        const result = await auditApi.getLogsPage({
          page,
          pageSize,
          search: searchQuery.trim() || undefined,
          action: actionFilter === 'all' ? undefined : actionFilter,
          auxiliary: aux,
        });
        if (cancelled) return;
        setLogs(result.items);
        setTotalCount(result.totalCount);
      } catch (error) {
        // The server is unreachable — fall back to the cached trail and notify.
        if (cancelled) return;
        const { logs: cached, stale } = await auditApi.getLogsWithStatus(aux);
        if (cancelled) return;
        setLogs(cached);
        setTotalCount(cached.length);
        if (stale) {
          toast.info(
            'The server could not be reached, so these are the last locally cached records. They may not reflect the latest activity. Refresh once the connection is restored.',
            { title: 'Showing cached entries', duration: 8000 }
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAuxiliary, actionFilter, authLoading, page, pageSize, router, searchQuery, user?.role]);

  if (authLoading || user?.role !== 'SUPER_ADMIN') {
    return <div className="min-h-40" role="status" aria-label="Checking access" />;
  }

  // Search and action are applied server-side, so the loaded page is final.
  const filteredLogs = logs;

  const actionTypes = [
    'all',
    'Login',
    'General Admin Assigned',
    'General Admin Revoked',
    'Event Created',
    'Event Updated',
    'Event Deleted',
    'Participant Added',
    'Participant Import',
    'Member Verification',
    'Certificate Generated',
    'Certificate Revoked',
    'Template Modified',
    'Template Deleted',
    'Template Save Failed',
  ];

  const handleOpenLog = async (log: AuditLog) => {
    try {
      setSelectedLog(await auditApi.getById(log.id));
    } catch {
      setSelectedLog(log);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Security &amp; Activity Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable log of administrative operations, certificate generation, and member verification.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
          leftIcon={
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          }
        >
          Refresh Feed
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by keyword, actor, or target..."
            className="focus:border-slate-300 focus:ring-slate-200"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={actionTypes.map((action) => ({
              value: action,
              label: action === 'all' ? 'All Activity Types' : action,
            }))}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="grid min-h-36 place-items-center p-12" role="status" aria-label="Loading audit logs">
              <span className="dual-ring-spinner" aria-hidden="true" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">No logs found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No recorded actions match your criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor / Admin</TableHead>
                  <TableHead>Auxiliary</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800 text-xs">
                        {log.adminName}
                      </div>
                      <div className="text-3xs text-slate-400 font-mono">
                        {log.adminRole}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.auxiliary ? (
                        <Badge auxiliary={log.auxiliary} />
                      ) : (
                        <span className="text-3xs text-slate-400">Global</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700 max-w-[200px] truncate">
                      <button type="button" onClick={() => void handleOpenLog(log)} className="truncate text-left hover:text-emerald-700 hover:underline">
                        {log.target}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-md">
                      <div className="line-clamp-2">{log.details}</div>
                      {log.ipAddress && (
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          isLoading={loading}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit log details"
        description={selectedLog?.action}
        maxWidth="md"
      >
        {selectedLog && (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-slate-500">Actor</dt><dd className="font-medium text-slate-900">{selectedLog.adminName} · {selectedLog.adminRole}</dd></div>
            <div><dt className="text-xs text-slate-500">Target</dt><dd className="font-medium text-slate-900">{selectedLog.target}</dd></div>
            <div><dt className="text-xs text-slate-500">Time</dt><dd className="font-medium text-slate-900">{formatDateTime(selectedLog.timestamp)}</dd></div>
            <div><dt className="text-xs text-slate-500">Details</dt><dd className="whitespace-pre-wrap text-slate-800">{selectedLog.details}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
