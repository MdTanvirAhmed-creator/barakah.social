'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Shield,
  FileText,
  Search,
  CheckCircle,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  verifiedPublishers: number;
}

const adminSections = [
  {
    title: 'Content Management',
    description: 'Manage content submissions and reviews',
    icon: FileText,
    href: '/admin/content',
    color: 'bg-blue-500',
  },
  {
    title: 'Publisher Management',
    description: 'Manage trusted publishers and applications',
    icon: Users,
    href: '/admin/publishers',
    color: 'bg-green-500',
  },
  {
    title: 'Scholar Verification',
    description: 'Review and manage verified scholars',
    icon: Shield,
    href: '/admin/scholars',
    color: 'bg-purple-500',
  },
  {
    title: 'Reports & Moderation',
    description: 'Review community reports and flags',
    icon: Search,
    href: '/admin/reports',
    color: 'bg-red-500',
  },
  {
    title: 'Content Verification',
    description: 'Review and verify content authenticity',
    icon: CheckCircle,
    href: '/admin/verification',
    color: 'bg-teal-500',
  },
  {
    title: 'Content Analytics',
    description: 'Track content engagement and performance',
    icon: BarChart3,
    href: '/admin/analytics/content',
    color: 'bg-indigo-500',
  },
];

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadStats() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [
        { count: totalUsers },
        { count: totalPosts },
        { count: pendingReports },
        { count: verifiedPublishers },
      ] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('posts').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
        sb.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        sb.from('trusted_publishers').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      ]);

      setStats({
        totalUsers: totalUsers ?? 0,
        totalPosts: totalPosts ?? 0,
        pendingReports: pendingReports ?? 0,
        verifiedPublishers: verifiedPublishers ?? 0,
      });
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage and monitor your Barakah.social platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            ))
          ) : (
            <>
              <StatCard icon={Users} color="blue" label="Total Users" value={stats?.totalUsers ?? 0} />
              <StatCard icon={FileText} color="green" label="Total Posts" value={stats?.totalPosts ?? 0} />
              <StatCard icon={CheckCircle} color="yellow" label="Pending Reports" value={stats?.pendingReports ?? 0} />
              <StatCard icon={Shield} color="purple" label="Trusted Publishers" value={stats?.verifiedPublishers ?? 0} />
            </>
          )}
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 group"
              >
                <div className="flex items-start">
                  <div className={`p-3 ${section.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/reports" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Activity className="h-4 w-4 mr-2" />
              Review Reports
            </Link>
            <Link href="/admin/scholars" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <TrendingUp className="h-4 w-4 mr-2" />
              Manage Scholars
            </Link>
            <Link href="/admin/publishers" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Shield className="h-4 w-4 mr-2" />
              Manage Publishers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number;
}) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
  };
  const text: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  };
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 ${bg[color]} rounded-lg`}>
          <Icon className={`h-6 w-6 ${text[color]}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
