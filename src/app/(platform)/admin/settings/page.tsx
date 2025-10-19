'use client';

import { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Users, 
  Bell,
  Database,
  Globe,
  Lock,
  Save,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Barakah.social',
    siteDescription: 'Islamic Social Networking Platform',
    siteUrl: 'https://barakah.social',
    adminEmail: 'admin@barakah.social',
    
    // User Settings
    allowRegistration: true,
    requireEmailVerification: true,
    allowGuestAccess: false,
    maxUsersPerDay: 100,
    
    // Content Settings
    autoApproveContent: false,
    requireContentReview: true,
    maxContentLength: 5000,
    allowFileUploads: true,
    maxFileSize: 10, // MB
    
    // Security Settings
    enableTwoFactor: true,
    sessionTimeout: 24, // hours
    maxLoginAttempts: 5,
    enableRateLimiting: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    adminNotifications: true,
    userNotifications: true
  });

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success message
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'content', name: 'Content', icon: Database },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure your Barakah.social platform settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleSettingChange('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Description
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site URL
                      </label>
                      <input
                        type="url"
                        value={settings.siteUrl}
                        onChange={(e) => handleSettingChange('siteUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* User Settings */}
              {activeTab === 'users' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">User Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Allow User Registration</h3>
                        <p className="text-sm text-gray-500">Allow new users to register on the platform</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Require Email Verification</h3>
                        <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Allow Guest Access</h3>
                        <p className="text-sm text-gray-500">Allow non-registered users to view content</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.allowGuestAccess}
                        onChange={(e) => handleSettingChange('allowGuestAccess', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Users Per Day
                      </label>
                      <input
                        type="number"
                        value={settings.maxUsersPerDay}
                        onChange={(e) => handleSettingChange('maxUsersPerDay', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Content Settings */}
              {activeTab === 'content' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Content Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Auto-approve Content</h3>
                        <p className="text-sm text-gray-500">Automatically approve content without manual review</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoApproveContent}
                        onChange={(e) => handleSettingChange('autoApproveContent', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Require Content Review</h3>
                        <p className="text-sm text-gray-500">All content must be reviewed before publication</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.requireContentReview}
                        onChange={(e) => handleSettingChange('requireContentReview', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Content Length (characters)
                      </label>
                      <input
                        type="number"
                        value={settings.maxContentLength}
                        onChange={(e) => handleSettingChange('maxContentLength', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Allow File Uploads</h3>
                        <p className="text-sm text-gray-500">Allow users to upload files with their content</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.allowFileUploads}
                        onChange={(e) => handleSettingChange('allowFileUploads', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum File Size (MB)
                      </label>
                      <input
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableTwoFactor}
                        onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (hours)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Login Attempts
                      </label>
                      <input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Enable Rate Limiting</h3>
                        <p className="text-sm text-gray-500">Limit API requests to prevent abuse</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableRateLimiting}
                        onChange={(e) => handleSettingChange('enableRateLimiting', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Send email notifications to users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Send push notifications to users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Admin Notifications</h3>
                        <p className="text-sm text-gray-500">Send notifications to admin users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.adminNotifications}
                        onChange={(e) => handleSettingChange('adminNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">User Notifications</h3>
                        <p className="text-sm text-gray-500">Send notifications to regular users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.userNotifications}
                        onChange={(e) => handleSettingChange('userNotifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Changes are saved automatically
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
