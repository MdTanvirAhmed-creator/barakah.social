'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Publisher {
  id: string;
  name: string;
  contact_email: string | null;
  contact_person: string | null;
  website: string | null;
  description: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  quality_score: number;
  specializations: string[];
  created_at: string;
}

export default function PublishersPage() {
  const supabase = createClient();
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPublishers = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('trusted_publishers')
        .select('id, name, contact_email, contact_person, website, description, verification_status, quality_score, specializations, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') query = query.eq('verification_status', statusFilter);

      const { data, error } = await query;
      if (!error) setPublishers((data as Publisher[]) ?? []);
    } catch (err) {
      console.error('Failed to load publishers:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPublishers();
  }, [loadPublishers]);

  async function updatePublisherStatus(id: string, newStatus: 'approved' | 'rejected') {
    setActionLoading(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('trusted_publishers')
      .update({ verification_status: newStatus, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setPublishers((prev) =>
        prev.map((p) => p.id === id ? { ...p, verification_status: newStatus } : p)
      );
    }
    setActionLoading(null);
  }

  const filtered = publishers.filter((p) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.contact_email ?? '').toLowerCase().includes(q) ||
      (p.contact_person ?? '').toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const counts = {
    pending: publishers.filter((p) => p.verification_status === 'pending').length,
    approved: publishers.filter((p) => p.verification_status === 'approved').length,
    rejected: publishers.filter((p) => p.verification_status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading publishers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Publisher Management</h1>
          <p className="mt-2 text-gray-600">Manage trusted publishers and review applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Pending', count: counts.pending, icon: Clock, bg: 'bg-yellow-100', color: 'text-yellow-600' },
            { label: 'Approved', count: counts.approved, icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
            { label: 'Rejected', count: counts.rejected, icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search publishers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Publishers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publisher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specializations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((publisher) => (
                  <tr key={publisher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg shrink-0">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{publisher.name}</div>
                          {publisher.contact_email && (
                            <div className="text-sm text-gray-500">{publisher.contact_email}</div>
                          )}
                          {publisher.contact_person && (
                            <div className="text-xs text-gray-400">{publisher.contact_person}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(publisher.verification_status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(publisher.verification_status)}`}>
                          {publisher.verification_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-900">{publisher.quality_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {publisher.specializations.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {s}
                          </span>
                        ))}
                        {publisher.specializations.length > 3 && (
                          <span className="text-xs text-gray-400">+{publisher.specializations.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(publisher.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {publisher.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => updatePublisherStatus(publisher.id, 'approved')}
                              disabled={actionLoading === publisher.id}
                              className="p-1.5 text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => updatePublisherStatus(publisher.id, 'rejected')}
                              disabled={actionLoading === publisher.id}
                              className="p-1.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {publisher.verification_status === 'approved' && (
                          <button
                            onClick={() => updatePublisherStatus(publisher.id, 'rejected')}
                            disabled={actionLoading === publisher.id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                        {publisher.verification_status === 'rejected' && (
                          <button
                            onClick={() => updatePublisherStatus(publisher.id, 'approved')}
                            disabled={actionLoading === publisher.id}
                            className="text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No publishers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'No publisher applications yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
