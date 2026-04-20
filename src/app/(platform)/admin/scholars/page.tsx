'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Search,
  Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Scholar {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified_scholar: boolean;
  beneficial_count: number;
  interests: string[];
  joined_at: string;
}

export default function ScholarsPage() {
  const supabase = createClient();
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadScholars();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadScholars() {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, is_verified_scholar, beneficial_count, interests, joined_at')
        .eq('is_verified_scholar', true)
        .order('beneficial_count', { ascending: false })
        .limit(100);

      if (!error) setScholars((data as Scholar[]) ?? []);
    } catch (err) {
      console.error('Failed to load scholars:', err);
    } finally {
      setLoading(false);
    }
  }

  async function revokeScholar(id: string) {
    setActionLoading(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ is_verified_scholar: false })
      .eq('id', id);

    if (!error) {
      setScholars((prev) => prev.filter((s) => s.id !== id));
    }
    setActionLoading(null);
  }

  const filtered = scholars.filter((s) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.bio ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading scholars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scholar Management</h1>
              <p className="mt-2 text-gray-600">Manage verified scholars on the platform</p>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">{scholars.length} verified scholars</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Scholars List */}
        <div className="space-y-4">
          {filtered.map((scholar) => (
            <div key={scholar.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-purple-100 rounded-lg shrink-0">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{scholar.full_name}</h3>
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Verified Scholar
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">@{scholar.username}</p>
                    {scholar.bio && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{scholar.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span>{scholar.beneficial_count.toLocaleString()} beneficial marks</span>
                      <span>Joined {new Date(scholar.joined_at).toLocaleDateString()}</span>
                    </div>
                    {scholar.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {scholar.interests.slice(0, 6).map((interest) => (
                          <span key={interest} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => revokeScholar(scholar.id)}
                    disabled={actionLoading === scholar.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    title="Revoke scholar status"
                  >
                    <XCircle className="h-4 w-4" />
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scholars found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Try adjusting your search.'
                : 'No verified scholars yet. Grant scholar status from user profiles.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

