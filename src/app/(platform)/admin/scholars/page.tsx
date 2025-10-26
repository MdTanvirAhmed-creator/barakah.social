'use client';

import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  User,
  Award,
  BookOpen,
  Shield
} from 'lucide-react';

interface Scholar {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  qualifications: string[];
  specializations: string[];
  experience: number;
  institution: string;
  submittedAt: string;
  reviewer?: string;
  verificationLevel: 'basic' | 'verified' | 'scholar';
  contentCount: number;
  followers: number;
}

export default function ScholarsPage() {
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Load scholars from database
  useEffect(() => {
    const loadScholars = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/scholars');
        // const data = await response.json();
        // setScholars(data);
        
        // For now, start with empty array
        setScholars([]);
      } catch (error) {
        console.error('Failed to load scholars:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScholars();
  }, []);

  const filteredScholars = scholars.filter(scholar => {
    const matchesSearch = scholar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholar.institution.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scholar.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || scholar.verificationLevel === levelFilter;
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'scholar': return 'bg-purple-100 text-purple-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
              <p className="mt-2 text-gray-600">
                Manage scholar applications and verifications
              </p>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <GraduationCap className="h-4 w-4 mr-2" />
              Add Scholar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scholars.filter(s => s.status === 'pending').length}
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
                <p className="text-sm font-medium text-gray-600">Approved Scholars</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scholars.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Scholars</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scholars.filter(s => s.verificationLevel === 'scholar').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scholars.reduce((sum, s) => sum + s.contentCount, 0)}
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
                  placeholder="Search scholars..."
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="scholar">Scholar</option>
                <option value="verified">Verified</option>
                <option value="basic">Basic</option>
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

        {/* Scholars List */}
        <div className="space-y-6">
          {filteredScholars.map((scholar) => (
            <div key={scholar.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{scholar.name}</h3>
                      <p className="text-gray-600">{scholar.institution}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scholar.status)}`}>
                        {scholar.status}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(scholar.verificationLevel)}`}>
                        {scholar.verificationLevel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Qualifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {scholar.qualifications.map((qual, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {scholar.specializations.map((spec, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{scholar.experience}</p>
                      <p className="text-sm text-gray-600">Years Experience</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{scholar.contentCount}</p>
                      <p className="text-sm text-gray-600">Content Pieces</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{scholar.followers.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{scholar.email}</p>
                      <p className="text-sm text-gray-600">Email</p>
                    </div>
                  </div>

                  {scholar.reviewer && (
                    <div className="text-sm text-gray-600">
                      Reviewed by: <span className="font-medium">{scholar.reviewer}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <User className="h-4 w-4" />
                  </button>
                  {scholar.status === 'pending' && (
                    <>
                      <button className="p-2 text-green-600 hover:text-green-800">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-800">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button className="p-2 text-blue-600 hover:text-blue-800">
                    <Shield className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredScholars.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scholars found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || levelFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No scholar applications have been submitted yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
