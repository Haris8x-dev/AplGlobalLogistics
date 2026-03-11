import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { Lock, Key, Shield, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
    const [passwordExists, setPasswordExists] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Form states
    const [createForm, setCreateForm] = useState({
        password: '',
        confirmPassword: ''
    });

    const [updateForm, setUpdateForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // Check if password exists on mount
    useEffect(() => {
        checkPasswordExists();
    }, []);

    const checkPasswordExists = async () => {
        try {
            // Try to update with empty data to check if password exists
            // const response = await axios.put(
            //     'http://localhost:5000/api/config/update-password',
            //     { currentPassword: '', newPassword: '' },
            //     { withCredentials: true }
            // );
            setPasswordExists(true);
        } catch (error: any) {
            // If 404, password doesn't exist
            if (error.response?.status === 404) {
                setPasswordExists(false);
            } else {
                // If 400, password exists but validation failed
                setPasswordExists(true);
            }
        }
    };

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!createForm.password || !createForm.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (createForm.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (createForm.password !== createForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post(
                '/api/config/create-password',
                { password: createForm.password }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                setCreateForm({ password: '', confirmPassword: '' });
                setPasswordExists(true);
            }
        } catch (error: any) {
            console.error('Error creating password:', error);
            toast.error(error.response?.data?.message || 'Failed to create password');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!updateForm.currentPassword || !updateForm.newPassword || !updateForm.confirmNewPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (updateForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters long');
            return;
        }

        if (updateForm.newPassword !== updateForm.confirmNewPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.put(
                '/api/config/update-password',
                {
                    currentPassword: updateForm.currentPassword,
                    newPassword: updateForm.newPassword
                }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                setUpdateForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            }
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (passwordExists === null) {
        return (
            <div className="min-h-screen bg-[var(--apl-bg-dark)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--apl-cyan)]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--apl-bg-dark)] p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="text-[var(--apl-cyan)]" size={32} />
                    Security Settings
                </h1>
                <p className="text-slate-400 mt-2">Manage your application entry password</p>
            </div>

            {/* Password Form Container */}
            <div className="max-w-2xl">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {!passwordExists ? (
                        /* Create Password Form */
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[var(--apl-cyan)]/10 border border-[var(--apl-cyan)]/20 flex items-center justify-center">
                                    <Key className="text-[var(--apl-cyan)]" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Create Entry Password</h2>
                                    <p className="text-sm text-slate-400">Set up your application entry password</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreatePassword} className="space-y-5">
                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={createForm.password}
                                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                            className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--apl-cyan)]/50 focus:border-[var(--apl-cyan)]"
                                            placeholder="Enter password (min 6 characters)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={createForm.confirmPassword}
                                            onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--apl-cyan)]/50 focus:border-[var(--apl-cyan)]"
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-[var(--apl-cyan)] hover:bg-[var(--apl-cyan)]/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating...' : 'Create Password'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Update Password Form */
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[var(--apl-cyan)]/10 border border-[var(--apl-cyan)]/20 flex items-center justify-center">
                                    <Key className="text-[var(--apl-cyan)]" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Update Entry Password</h2>
                                    <p className="text-sm text-slate-400">Change your application entry password</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={updateForm.currentPassword}
                                            onChange={(e) => setUpdateForm({ ...updateForm, currentPassword: e.target.value })}
                                            className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--apl-cyan)]/50 focus:border-[var(--apl-cyan)]"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={updateForm.newPassword}
                                            onChange={(e) => setUpdateForm({ ...updateForm, newPassword: e.target.value })}
                                            className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--apl-cyan)]/50 focus:border-[var(--apl-cyan)]"
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={updateForm.confirmNewPassword}
                                            onChange={(e) => setUpdateForm({ ...updateForm, confirmNewPassword: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--apl-cyan)]/50 focus:border-[var(--apl-cyan)]"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-[var(--apl-cyan)] hover:bg-[var(--apl-cyan)]/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-sm flex items-start gap-2">
                        <Shield size={18} className="mt-0.5 flex-shrink-0" />
                        <span>
                            This password is used to secure your application entry. Make sure to remember it or store it securely.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;