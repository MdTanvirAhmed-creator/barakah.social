'use client';

import { useState, useEffect } from 'react';
import { 
  Flag, 
  AlertTriangle, 
  Shield, 
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Report {
  id: string;
  type: 'spam' | 'inappropriate' | 'copyright' | 'harassment' | 'misinformation';
  reporter: string;
  reportedContent: string;
  reportedUser?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  description: string;
  reviewer?: string;
  resolution?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Mock data for now
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        type: 'spam',
        reporter: 'user123',
        reportedContent: 'Suspicious promotional content',
        reportedUser: 'spammer456',
        status: 'pending',
        priority: 'high',
        createdAt: '2024-01-20',
        description: 'User is posting promotional content repeatedly across multiple posts'
      },
      {
        id: '2',
        type: 'inappropriate',
        reporter: 'moderator789',
        reportedContent: 'Inappropriate language in discussion',
        reportedUser: 'user456',
        status: 'reviewed',
        priority: 'medium',
        createdAt: '2024-01-18',
        description: 'User used inappropriate language in a religious discussion',
        reviewer: 'Admin User',
        resolution: 'Content removed, user warned'
      },
      {
        id: '3',
        type: 'misinformation',
        reporter: 'scholar123',
        reportedContent: 'Incorrect hadith citation',
        reportedUser: 'user789',
        status: 'resolved',
        priority: 'high',
        createdAt: '2024-01-15',
        description: 'User shared a hadith with incorrect chain of narration',
        reviewer: 'Dr. Ahmad',
        resolution: 'Content corrected, proper citation provided'
      }
    ];
    
    setReports(mockReports);
    setLoading(false);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportedContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'spam': return 'bg-red-100 text-red-800';
      case 'inappropriate': return 'bg-orange-100 text-orange-800';
      case 'copyright': return 'bg-purple-100 text-purple-800';
      case 'harassment': return 'bg-pink-100 text-pink-800';
      case 'misinformation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spam': return <Flag className="h-4 w-4" />;
      case 'inappropriate': return <AlertTriangle className="h-4 w-4" />;
      case 'copyright': return <Shield className="h-4 w-4" />;
      case 'harassment': return <Users className="h-4 w-4" />;
      case 'misinformation': return <AlertTriangle className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Moderation</h1>
              <p className="mt-2 text-gray-600">
                Review and manage community reports
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Flag className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'reviewed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dismissed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'dismissed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
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
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate</option>
                <option value="copyright">Copyright</option>
                <option value="harassment">Harassment</option>
                <option value="misinformation">Misinformation</option>
              </select>
            </div>
            <div>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                      {report.priority} priority
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {report.reportedContent}
                  </h3>
                  
                  <p className="text-gray-600 mb-3">{report.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div>Reported by: <span className="font-medium">{report.reporter}</span></div>
                    <div>Date: <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span></div>
                    {report.reportedUser && (
                      <div>Reported user: <span className="font-medium">{report.reportedUser}</span></div>
                    )}
                  </div>

                  {report.reviewer && (
                    <div className="text-sm text-gray-600 mb-2">
                      Reviewed by: <span className="font-medium">{report.reviewer}</span>
                    </div>
                  )}

                  {report.resolution && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">Resolution:</p>
                      <p className="text-sm text-gray-700">{report.resolution}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  {report.status === 'pending' && (
                    <>
                      <button className="p-2 text-green-600 hover:text-green-800">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-800">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Flag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No reports have been submitted yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
