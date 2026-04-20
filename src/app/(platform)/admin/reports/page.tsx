'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  AlertTriangle,
  Shield,
  Users,
  Search,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Report {
  id: string;
  reason: string;
  content_type: string;
  content_id: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at: string | null;
  resolution_note: string | null;
  reporter: { username: string; full_name: string } | null;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('reports')
        .select(`
          id, reason, content_type, content_id, description, status,
          created_at, reviewed_at, resolution_note,
          reporter:profiles!reports_reporter_id_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (typeFilter !== 'all') query = query.eq('content_type', typeFilter);

      const { data, error } = await query;
      if (!error) setReports((data as Report[]) ?? []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function updateStatus(id: string, newStatus: 'resolved' | 'dismissed') {
    setActionLoading(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('reports')
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setReports((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: newStatus } : r)
      );
    }
    setActionLoading(null);
  }

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    if (q && !r.reason.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'bg-red-100 text-red-800';
      case 'inappropriate_content': return 'bg-orange-100 text-orange-800';
      case 'misinformation': return 'bg-yellow-100 text-yellow-800';
      case 'harassment': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile': return <Users className="h-4 w-4" />;
      case 'comment': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const counts = {
    pending: reports.filter((r) => r.status === 'pending').length,
    reviewed: reports.filter((r) => r.status === 'reviewed').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Moderation</h1>
          <p className="mt-2 text-gray-600">Review and manage community reports</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Pending', count: counts.pending, icon: Flag, bg: 'bg-yellow-100', color: 'text-yellow-600' },
            { label: 'Under Review', count: counts.reviewed, icon: Eye, bg: 'bg-blue-100', color: 'text-blue-600' },
            { label: 'Resolved', count: counts.resolved, icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
            { label: 'Dismissed', count: counts.dismissed, icon: XCircle, bg: 'bg-gray-100', color: 'text-gray-600' },
          ].map(({ label, count, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 ${bg} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Content Types</option>
              <option value="post">Post</option>
              <option value="comment">Comment</option>
              <option value="profile">Profile</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filtered.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1 text-gray-500">
                      {getTypeIcon(report.content_type)}
                      <span className="text-xs font-medium uppercase">{report.content_type}</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonColor(report.reason)}`}>
                      {report.reason.replace(/_/g, ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-gray-700 mb-3">{report.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {report.reporter && (
                      <span>Reported by: <span className="font-medium text-gray-700">@{report.reporter.username}</span></span>
                    )}
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    {report.reviewed_at && (
                      <span>Reviewed: {new Date(report.reviewed_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {report.resolution_note && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Resolution note:</p>
                      <p className="text-sm text-gray-700">{report.resolution_note}</p>
                    </div>
                  )}
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      disabled={actionLoading === report.id}
                      className="p-2 text-green-600 hover:text-green-800 disabled:opacity-50"
                      title="Resolve"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updateStatus(report.id, 'dismissed')}
                      disabled={actionLoading === report.id}
                      className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Dismiss"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Flag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No reports have been submitted yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
