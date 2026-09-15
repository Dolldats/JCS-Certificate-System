'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { auditApi } from '../../../services/api';
import { AuditLog, Auxiliary } from '../../../types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
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
  const { activeAuxiliary } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
    const data = await auditApi.getLogs(aux);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [activeAuxiliary]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.details.toLowerCase().includes(q) ||
      log.adminName.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const actionTypes = [
    'all',
    'Login',
    'General Admin Assigned',
    'General Admin Revoked',
    'Event Created',
    'Event Updated',
    'Participant Import',
    'Member Verification',
    'Certificate Generated',
    'Certificate Revoked',
    'Template Modified',
  ];

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
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Feed
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by keyword, actor, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
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
            <div className="p-12 text-center text-xs text-slate-500">
              Loading audit logs...
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
                      {log.target}
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
    </div>
  );
}
