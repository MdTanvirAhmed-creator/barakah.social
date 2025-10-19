'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  Shield, 
  FileText, 
  Search, 
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats] = useState({
    totalUsers: 1250,
    totalContent: 340,
    pendingReviews: 12,
    verifiedPublishers: 45
  });

  const adminSections = [
    {
      title: 'Content Management',
      description: 'Manage content submissions and reviews',
      icon: FileText,
      href: '/admin/content',
      color: 'bg-blue-500'
    },
    {
      title: 'Publisher Management',
      description: 'Manage trusted publishers and applications',
      icon: Users,
      href: '/admin/publishers',
      color: 'bg-green-500'
    },
    {
      title: 'Content Verification',
      description: 'Review and verify content authenticity',
      icon: Shield,
      href: '/admin/verification',
      color: 'bg-purple-500'
    },
    {
      title: 'Search Analytics',
      description: 'Monitor search performance and trends',
      icon: Search,
      href: '/admin/search-analytics',
      color: 'bg-orange-500'
    },
    {
      title: 'Content Analytics',
      description: 'Track content engagement and performance',
      icon: BarChart3,
      href: '/admin/analytics/content',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor your Barakah.social platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Publishers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verifiedPublishers}</p>
              </div>
            </div>
          </div>
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
                    <p className="text-sm text-gray-600 mt-1">
                      {section.description}
                    </p>
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
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Activity className="h-4 w-4 mr-2" />
              View Recent Activity
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Shield className="h-4 w-4 mr-2" />
              Security Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
