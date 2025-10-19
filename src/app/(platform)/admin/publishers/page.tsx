'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Plus
} from 'lucide-react';

interface Publisher {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationLevel: 'basic' | 'verified' | 'scholar';
  createdAt: string;
  contentCount: number;
  followers: number;
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data for now
  useEffect(() => {
    const mockPublishers: Publisher[] = [
      {
        id: '1',
        name: 'Dr. Ahmad Al-Mahmoud',
        email: 'ahmad@example.com',
        status: 'approved',
        verificationLevel: 'scholar',
        createdAt: '2024-01-15',
        contentCount: 45,
        followers: 1250
      },
      {
        id: '2',
        name: 'Islamic Knowledge Center',
        email: 'info@ikc.org',
        status: 'pending',
        verificationLevel: 'basic',
        createdAt: '2024-01-20',
        contentCount: 12,
        followers: 340
      },
      {
        id: '3',
        name: 'Sheikh Yusuf Al-Qaradawi',
        email: 'yusuf@example.com',
        status: 'approved',
        verificationLevel: 'scholar',
        createdAt: '2024-01-10',
        contentCount: 78,
        followers: 2100
      }
    ];
    
    setPublishers(mockPublishers);
    setLoading(false);
  }, []);

  const filteredPublishers = publishers.filter(publisher => {
    const matchesSearch = publisher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         publisher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || publisher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'scholar': return { text: 'Scholar', color: 'bg-purple-100 text-purple-800' };
      case 'verified': return { text: 'Verified', color: 'bg-blue-100 text-blue-800' };
      case 'basic': return { text: 'Basic', color: 'bg-gray-100 text-gray-800' };
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Publisher Management</h1>
              <p className="mt-2 text-gray-600">
                Manage trusted publishers and review applications
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Publisher
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search publishers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
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
        </div>

        {/* Publishers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publisher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Followers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPublishers.map((publisher) => {
                  const verification = getVerificationBadge(publisher.verificationLevel);
                  return (
                    <tr key={publisher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {publisher.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {publisher.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(publisher.status)}`}>
                          {publisher.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${verification.color}`}>
                          {verification.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {publisher.contentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {publisher.followers.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {publisher.status === 'pending' && (
                            <>
                              <button className="text-green-600 hover:text-green-900">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900">
                            <Shield className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredPublishers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No publishers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first publisher.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
