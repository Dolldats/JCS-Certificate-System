'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../services/api';
import { User, Auxiliary } from '../../../types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  Search,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const AUXILIARY_OPTIONS: Auxiliary[] = [
  'Khuddam',
  'Ansarullah',
  'Lajna',
  'Nasra',
  'Atfal',
];

export default function AdminsPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignAuxiliary, setAssignAuxiliary] = useState<Auxiliary>('Atfal');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const loadAdmins = async () => {
    setLoading(true);
    const users = await authApi.getAllUsers();
    setAdmins(users);
    setLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignMemberId.trim()) return;
    setIsAssigning(true);
    setAssignError('');

    try {
      await authApi.assignGeneralAdmin(
        assignMemberId.trim().toUpperCase(),
        assignAuxiliary,
        user
      );
      setIsAssignOpen(false);
      setAssignMemberId('');
      await loadAdmins();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign administrator');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (adminId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to revoke General Admin privileges for this user?')) {
      await authApi.revokeGeneralAdmin(adminId, user);
      await loadAdmins();
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.memberId.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.assignedAuxiliary && a.assignedAuxiliary.toLowerCase().includes(q))
    );
  });

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Admin role assignments can only be managed by Super Administrators at National Headquarters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Administrator Access &amp; Auxiliaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Super Admin console to assign existing Jama&apos;at members as General Admins for each auxiliary.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAssignOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Assign Auxiliary Admin
        </Button>
      </div>

      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <span className="font-bold block">No Duplicate Accounts Policy:</span>
          <p className="leading-relaxed">
            As specified in Section 3 of the System Design, the system uses existing Jama&apos;at members verified through the Central API. Super Admins assign General Admin permissions directly to existing member records with specific auxiliary scopes.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search admins by name, Member ID, or auxiliary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Auxiliary</TableHead>
                <TableHead>Region &amp; Jama&apos;at</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {admin.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {admin.fullName}
                        </div>
                        <div className="text-3xs text-slate-400">{admin.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">
                    {admin.memberId}
                  </TableCell>
                  <TableCell>
                    {admin.role === 'SUPER_ADMIN' ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-2xs font-bold px-2 py-0.5 rounded-full">
                        ⭐ Super Admin
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 text-2xs font-medium px-2 py-0.5 rounded-full">
                        General Admin
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.assignedAuxiliary ? (
                      <Badge auxiliary={admin.assignedAuxiliary} />
                    ) : (
                      <span className="text-2xs text-slate-500 font-semibold">
                        All Auxiliaries (Global)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {admin.jamaat ? `${admin.jamaat}, ${admin.dila}` : 'National HQ'}
                  </TableCell>
                  <TableCell className="text-right">
                    {admin.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleRevoke(admin.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Existing Jama'at User as General Admin"
        description="Verify an existing Member ID from the central registry and grant auxiliary certificate permissions."
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          {assignError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{assignError}</span>
            </div>
          )}

          <Input
            label="Member ID *"
            value={assignMemberId}
            onChange={(e) => setAssignMemberId(e.target.value)}
            placeholder="e.g. ATF-2025-01 or MK-10293"
            helperText="Quick test IDs: ATF-2025-01, MK-10293, LAJ-40912"
            required
          />

          <Select
            label="Assign Auxiliary Scope *"
            value={assignAuxiliary}
            onChange={(e) => setAssignAuxiliary(e.target.value as Auxiliary)}
            options={AUXILIARY_OPTIONS.map((a) => ({
              value: a,
              label: `${a} Majlis`,
            }))}
          />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-2xs text-slate-500 leading-relaxed">
            The assigned user will only have access to manage events, participants, and certificate generation for the assigned auxiliary.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAssigning}
            >
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
