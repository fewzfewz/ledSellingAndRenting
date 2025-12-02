'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { apiPut, apiPost } from '../../../lib/api';

export default function AdminSettingsPage() {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'admins' | 'system'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form States
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'admin'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    maintenanceMode: false,
    debugMode: false
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call for now as we don't have a profile update endpoint yet
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    showMessage('success', 'Profile updated successfully!');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiPut('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showMessage('success', 'Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost('/auth/admin/create', newAdminData);
      showMessage('success', 'New admin created successfully!');
      setNewAdminData({ name: '', email: '', password: '', phone: '' });
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' : 'bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-900'}`}>
      <Navbar />
      
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-500 ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
        <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-500 ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Link href="/admin/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black mt-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Settings
              </span>
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Manage your account and system preferences</p>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`mt-4 md:mt-0 px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <span className="text-xl">{isDark ? '🌙' : '☀️'}</span>
            <span className="font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20 text-green-500' 
              : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}>
            <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className={`backdrop-blur-lg rounded-2xl border p-4 space-y-2 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'
            }`}>
              {[
                { id: 'profile', label: 'Profile Settings', icon: '👤' },
                { id: 'security', label: 'Security', icon: '🔒' },
                { id: 'admins', label: 'Manage Admins', icon: '🛡️' },
                { id: 'system', label: 'System Preferences', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-500 border border-blue-500/30'
                      : isDark 
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
              
              <div className={`pt-4 mt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <span className="text-xl">🚪</span>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Admin Badge */}
            <div className={`mt-6 rounded-2xl border p-6 text-center ${
              isDark 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg shadow-blue-500/30">
                {user.name?.charAt(0) || 'A'}
              </div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</h3>
              <p className="text-sm text-blue-400 font-medium uppercase tracking-wider mt-1">{user.role}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className={`backdrop-blur-lg rounded-2xl border p-8 animate-fadeIn ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'
              }`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="p-2 bg-blue-500/20 rounded-lg text-2xl">👤</span>
                  Profile Information
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                          isDark 
                            ? 'bg-black/20 border-white/10 text-white focus:border-blue-500/50 focus:bg-black/30' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                          isDark 
                            ? 'bg-black/20 border-white/10 text-white focus:border-blue-500/50 focus:bg-black/30' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Role</label>
                    <input
                      type="text"
                      value={profileData.role}
                      disabled
                      className={`w-full px-4 py-3 rounded-xl border cursor-not-allowed uppercase ${
                        isDark 
                          ? 'bg-white/5 border-white/5 text-gray-500' 
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-2">Role cannot be changed manually.</p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={`backdrop-blur-lg rounded-2xl border p-8 animate-fadeIn ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'
              }`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="p-2 bg-purple-500/20 rounded-lg text-2xl">🔒</span>
                  Security Settings
                </h2>
                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-xl">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-purple-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-purple-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-purple-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-purple-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-purple-600/20 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className={`backdrop-blur-lg rounded-2xl border p-8 animate-fadeIn ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'
              }`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="p-2 bg-red-500/20 rounded-lg text-2xl">🛡️</span>
                  Create New Admin
                </h2>
                <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <p className="text-sm">
                    <strong>Note:</strong> Creating a new admin grants them full access to the dashboard, including managing orders, inventory, and other admins.
                  </p>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-6 max-w-xl">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Admin Name</label>
                    <input
                      type="text"
                      required
                      value={newAdminData.name}
                      onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-red-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-red-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
                    <input
                      type="password"
                      required
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-red-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone (Optional)</label>
                    <input
                      type="tel"
                      value={newAdminData.phone}
                      onChange={(e) => setNewAdminData({ ...newAdminData, phone: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-red-500/50 focus:bg-black/30' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-red-600/20 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Admin Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'system' && (
              <div className={`backdrop-blur-lg rounded-2xl border p-8 animate-fadeIn ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200 shadow-lg'
              }`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <span className="p-2 bg-green-500/20 rounded-lg text-2xl">⚙️</span>
                  System Preferences
                </h2>
                
                <div className="space-y-6">
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Notifications</h3>
                      <p className="text-sm text-gray-400">Receive alerts for new orders and rentals</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={systemSettings.emailNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Maintenance Mode</h3>
                      <p className="text-sm text-gray-400">Disable customer access temporarily</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Debug Mode</h3>
                      <p className="text-sm text-gray-400">Show detailed error logs in console</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={systemSettings.debugMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, debugMode: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>System Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-100'}`}>
                        <span className="text-gray-500 block">Version</span>
                        <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>v1.2.0</span>
                      </div>
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-100'}`}>
                        <span className="text-gray-500 block">Environment</span>
                        <span className="text-blue-400 font-mono">Production</span>
                      </div>
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-100'}`}>
                        <span className="text-gray-500 block">Database</span>
                        <span className="text-green-400 font-mono">Connected</span>
                      </div>
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-black/20' : 'bg-gray-100'}`}>
                        <span className="text-gray-500 block">Last Backup</span>
                        <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
