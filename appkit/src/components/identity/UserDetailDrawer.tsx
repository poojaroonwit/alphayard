import React, { useState, useEffect } from 'react';
import { GlobalUser, userService } from '../../services/userService';
import { identityService, UserSession, UserDevice, UserMFA, assignUserRole } from '../../services/identityService';
import { adminService, Role } from '../../services/adminService';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { UserAttributesEditor } from './UserAttributesEditor';
import { toast } from '@/hooks/use-toast';
import { Badge } from '../ui/Badge';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { MobileGuide } from '../ui/MobileGuide';
import { 
    XMarkIcon, 
    UserIcon, 
    EnvelopeIcon, 
    TagIcon,
    Squares2X2Icon,
    ShieldCheckIcon,
    ArrowPathIcon,
    NoSymbolIcon,
    BookOpenIcon,
    CameraIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    ClockIcon,
    KeyIcon,
    TrashIcon,
    ShieldExclamationIcon,
    CheckCircleIcon,
    XCircleIcon,
    GlobeAltIcon,
    FingerPrintIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';
import { ChipField } from '../ui/ChipField';
import { MediaPickerModal } from '../../components/cms/MediaPickerModal';

interface UserDetailDrawerProps {
    userId: string | null;
    onClose: () => void;
    onUserUpdated: () => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({ userId, onClose, onUserUpdated }) => {
    const [user, setUser] = useState<GlobalUser | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'sessions' | 'devices' | 'mfa' | 'apps' | 'attributes'>('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    
    // Sessions, Devices, MFA state
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [devices, setDevices] = useState<UserDevice[]>([]);
    const [mfaSettings, setMfaSettings] = useState<UserMFA[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [devicesLoading, setDevicesLoading] = useState(false);
    const [mfaLoading, setMfaLoading] = useState(false);
    
    // Roles state
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<string>('');

    useEffect(() => {
        if (userId) {
            loadUser(userId);
            loadRoles();
        } else {
            setUser(null);
            setSessions([]);
            setDevices([]);
            setMfaSettings([]);
        }
    }, [userId]);
    
    useEffect(() => {
        if (userId && activeTab === 'sessions') {
            loadSessions();
        } else if (userId && activeTab === 'devices') {
            loadDevices();
        } else if (userId && activeTab === 'mfa') {
            loadMfaSettings();
        }
    }, [userId, activeTab]);

    const loadUser = async (id: string) => {
        setLoading(true);
        try {
            const data = await userService.getUserById(id);
            setUser(data || null);
            if (data?.role) {
                setSelectedRoleId(data.role);
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to load user details", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    const loadRoles = async () => {
        setRolesLoading(true);
        try {
            const rolesData = await adminService.getRoles();
            setRoles(rolesData);
        } catch (e) {
            console.error('Failed to load roles:', e);
        } finally {
            setRolesLoading(false);
        }
    };
    
    const handleAssignRole = async (roleId: string) => {
        if (!userId) return;
        try {
            await assignUserRole(userId, roleId || undefined);
            setSelectedRoleId(roleId);
            toast({ title: "Success", description: roleId ? "Role assigned successfully" : "Role removed" });
            onUserUpdated();
        } catch (e) {
            toast({ title: "Error", description: "Failed to assign role", variant: "destructive" });
        }
    };
    
    const loadSessions = async () => {
        if (!userId) return;
        setSessionsLoading(true);
        try {
            const { sessions } = await identityService.getUserSessions(userId, true);
            setSessions(sessions);
        } catch (e) {
            console.error('Failed to load sessions:', e);
        } finally {
            setSessionsLoading(false);
        }
    };
    
    const loadDevices = async () => {
        if (!userId) return;
        setDevicesLoading(true);
        try {
            const { devices } = await identityService.getUserDevices(userId);
            setDevices(devices);
        } catch (e) {
            console.error('Failed to load devices:', e);
        } finally {
            setDevicesLoading(false);
        }
    };
    
    const loadMfaSettings = async () => {
        if (!userId) return;
        setMfaLoading(true);
        try {
            const { mfaSettings } = await identityService.getUserMFA(userId);
            setMfaSettings(mfaSettings);
        } catch (e) {
            console.error('Failed to load MFA settings:', e);
        } finally {
            setMfaLoading(false);
        }
    };
    
    const handleRevokeSession = async (sessionId: string) => {
        try {
            await identityService.revokeSession(sessionId);
            toast({ title: "Success", description: "Session revoked" });
            loadSessions();
        } catch (e) {
            toast({ title: "Error", description: "Failed to revoke session", variant: "destructive" });
        }
    };
    
    const handleRevokeAllSessions = async () => {
        if (!userId || !confirm('Revoke all sessions for this user? They will be logged out everywhere.')) return;
        try {
            await identityService.revokeAllUserSessions(userId);
            toast({ title: "Success", description: "All sessions revoked" });
            loadSessions();
        } catch (e) {
            toast({ title: "Error", description: "Failed to revoke sessions", variant: "destructive" });
        }
    };
    
    const handleToggleDeviceTrust = async (deviceId: string, currentlyTrusted: boolean) => {
        try {
            await identityService.trustDevice(deviceId, !currentlyTrusted);
            toast({ title: "Success", description: currentlyTrusted ? "Device verification removed" : "Device trusted" });
            loadDevices();
        } catch (e) {
            toast({ title: "Error", description: "Failed to update device", variant: "destructive" });
        }
    };
    
    const handleDeleteDevice = async (deviceId: string) => {
        if (!confirm('Remove this device? The user will need to re-authenticate on this device.')) return;
        try {
            await identityService.deleteDevice(deviceId);
            toast({ title: "Success", description: "Device removed" });
            loadDevices();
        } catch (e) {
            toast({ title: "Error", description: "Failed to remove device", variant: "destructive" });
        }
    };
    
    const handleDisableMFA = async (mfaId: string) => {
        if (!userId || !confirm('Disable this MFA method? The user may lose access if they only have one method configured.')) return;
        try {
            await identityService.disableUserMFA(userId, mfaId);
            toast({ title: "Success", description: "MFA method disabled" });
            loadMfaSettings();
        } catch (e) {
            toast({ title: "Error", description: "Failed to disable MFA", variant: "destructive" });
        }
    };
    
    const handleGenerateBackupCodes = async () => {
        if (!userId || !confirm('Generate new backup codes? This will invalidate any existing codes.')) return;
        try {
            const { codes } = await identityService.generateBackupCodes(userId);
            alert(`New backup codes generated:\n\n${codes.join('\n')}\n\nShare these with the user securely.`);
        } catch (e) {
            toast({ title: "Error", description: "Failed to generate backup codes", variant: "destructive" });
        }
    };
    
    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString();
    };
    
    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType?.toLowerCase()) {
            case 'mobile':
            case 'phone':
                return <DevicePhoneMobileIcon className="w-5 h-5" />;
            case 'tablet':
                return <DevicePhoneMobileIcon className="w-5 h-5" />;
            default:
                return <ComputerDesktopIcon className="w-5 h-5" />;
        }
    };

    const handleSave = async (updates: Partial<GlobalUser>) => {
        if (!user) return;
        setSaving(true);
        try {
            const updatedUser = await userService.updateUser(user.id, updates);
            setUser(updatedUser);
            onUserUpdated();
            toast({ title: "Updated", description: "User details saved successfully." });
        } catch (e) {
            toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (!userId) return null;

    return (
        <Drawer 
            isOpen={!!userId} 
            onClose={onClose} 
            side="right" 
            hideHeader 
            noPadding
            className="max-w-xl"
        >
            {loading || !user ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 shrink-0">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white backdrop-blur-sm" title="Close" aria-label="Close drawer">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative z-20 px-8 -mt-12 pb-6 border-b border-gray-100 flex items-end justify-between">
                        <div className="flex items-end gap-5">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-xl shadow-blue-900/10 cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                            {user.firstName[0]}
                                        </div>
                                    )}
                                    
                                    {/* Edit Overlay */}
                                    <div className="absolute inset-0 m-1.5 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <CameraIcon className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-1">
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.firstName} {user.lastName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={user.status === 'active' ? 'success' : user.status === 'banned' ? 'error' : 'warning'}>
                                        {user.status}
                                    </Badge>
                                    <span className="text-sm text-gray-500">• Member since {new Date(user.createdAt).getFullYear()}</span>
                                    <MobileGuide 
                                        title="User Data Reference"
                                        buttonLabel="Dev Guide"
                                        buttonVariant="labeled"
                                        className="h-7 px-2 ml-2"
                                        idLabel="User Global ID"
                                        idValue={user.id}
                                        usageExample={`// Get this user details
const user = await userService.getUserById('${user.id}');

// Update user status
await userService.updateUser('${user.id}', { status: 'inactive' });`}
                                        devNote="This ID is the primary key and is essential for all user-related relations (Circles, Messages, etc.)."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-8 bg-white z-10 overflow-x-auto no-scrollbar">
                        <TabButton id="profile" icon={<UserIcon className="w-4 h-4" />} label="Profile" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="sessions" icon={<ClockIcon className="w-4 h-4" />} label="Sessions" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="devices" icon={<DevicePhoneMobileIcon className="w-4 h-4" />} label="Devices" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="mfa" icon={<ShieldCheckIcon className="w-4 h-4" />} label="MFA" active={activeTab} onClick={setActiveTab} />
                        <TabButton id="apps" icon={<Squares2X2Icon className="w-4 h-4" />} label={`Apps`} active={activeTab} onClick={setActiveTab} />
                        <TabButton id="attributes" icon={<TagIcon className="w-4 h-4" />} label="Data" active={activeTab} onClick={setActiveTab} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="First Name" value={user.firstName} onChange={e => handleSave({ firstName: e.target.value })} />
                                            <Input label="Last Name" value={user.lastName} onChange={e => handleSave({ lastName: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <EnvelopeIcon className="w-4 h-4 absolute right-3 top-[34px] text-gray-400" />
                                            <Input label="Email Address" value={user.email} onChange={e => handleSave({ email: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account Management</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                                        <div className="p-5">
                                            <ToggleSwitch 
                                                checked={user.status === 'active'}
                                                onChange={checked => handleSave({ status: checked ? 'active' : 'inactive' })}
                                                label="Account Status"
                                                description="Disable to block all application access immediately."
                                            />
                                        </div>
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">Email Verification</span>
                                                <span className="text-xs text-slate-500">Enable if the user has verified their email.</span>
                                            </div>
                                            <Badge variant={user.isVerified ? 'success' : 'warning'}>
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Role Assignment</h3>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <UserGroupIcon className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Assign Admin Role</span>
                                        </div>
                                        {rolesLoading ? (
                                            <div className="flex justify-center py-4">
                                                <ArrowPathIcon className="w-5 h-5 animate-spin text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <select
                                                    value={selectedRoleId}
                                                    onChange={(e) => handleAssignRole(e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg text-sm"
                                                    title="Select role"
                                                >
                                                    <option value="">No role assigned</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name} {role.is_system ? '(System)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {selectedRoleId && (
                                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: roles.find(r => r.id === selectedRoleId)?.color || '#3B82F6' }}
                                                        />
                                                        <span className="text-sm font-medium text-blue-700">
                                                            {roles.find(r => r.id === selectedRoleId)?.name}
                                                        </span>
                                                        <span className="text-xs text-blue-500 ml-auto">
                                                            {roles.find(r => r.id === selectedRoleId)?.permission_count || 0} permissions
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tags & Categories</h3>
                                     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                         <ChipField 
                                            chips={user.tags || []} 
                                            onChange={tags => handleSave({ tags })} 
                                            placeholder="Add tag..." 
                                         />
                                     </div>
                                </section>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 h-11"><ArrowPathIcon className="w-4 h-4 mr-2" /> Reset Password</Button>
                                    <Button 
                                        variant="ghost" 
                                        className="flex-1 h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleSave({ status: user.status === 'banned' ? 'active' : 'banned' })}
                                    >
                                        <NoSymbolIcon className="w-4 h-4 mr-2" />
                                        {user.status === 'banned' ? 'Revoke Ban' : 'Permanent Ban'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Sessions</h3>
                                    <Button variant="outline" size="sm" onClick={handleRevokeAllSessions} className="text-red-600 hover:text-red-700">
                                        Revoke All
                                    </Button>
                                </div>
                                
                                {sessionsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <ClockIcon className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-gray-400">No active sessions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sessions.map(session => (
                                            <div key={session.id} className={`bg-white rounded-xl border p-4 ${session.isExpired ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.isExpired ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                                                            {getDeviceIcon(session.deviceType || '')}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{session.deviceName || 'Unknown Device'}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                                                <GlobeAltIcon className="w-3 h-3" />
                                                                {session.ipAddress || 'Unknown IP'}
                                                                {session.location && ` • ${session.location}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!session.isExpired && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleRevokeSession(session.id)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            Revoke
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                                    <span>Created: {formatTimeAgo(session.createdAt)}</span>
                                                    <span>Last active: {formatTimeAgo(session.lastActivityAt || session.createdAt)}</span>
                                                    {session.isExpired && <Badge variant="warning" size="sm">Expired</Badge>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'devices' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Registered Devices</h3>
                                
                                {devicesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : devices.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <DevicePhoneMobileIcon className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                                        <p className="text-gray-400">No registered devices</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {devices.map(device => (
                                            <div key={device.id} className={`bg-white rounded-xl border p-4 ${device.isBlocked ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                            device.isBlocked ? 'bg-red-100 text-red-600' : 
                                                            device.isTrusted ? 'bg-green-100 text-green-600' : 
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {getDeviceIcon(device.deviceType)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-gray-900">{device.deviceName || 'Unknown Device'}</p>
                                                                {device.isTrusted && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                                                                {device.isBlocked && <XCircleIcon className="w-4 h-4 text-red-500" />}
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {device.osName} {device.osVersion} • {device.browserName || device.appVersion || 'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleToggleDeviceTrust(device.id, device.isTrusted || false)}
                                                            className={device.isTrusted ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}
                                                        >
                                                            {device.isTrusted ? 'Untrust' : 'Trust'}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleDeleteDevice(device.id)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                                    <span>First seen: {new Date(device.createdAt).toLocaleDateString()}</span>
                                                    <span>Last seen: {formatTimeAgo(device.lastSeenAt || device.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mfa' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Multi-Factor Authentication</h3>
                                    <Button variant="outline" size="sm" onClick={handleGenerateBackupCodes}>
                                        <KeyIcon className="w-4 h-4 mr-2" />
                                        Generate Backup Codes
                                    </Button>
                                </div>
                                
                                {mfaLoading ? (
                                    <div className="flex justify-center py-8">
                                        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : mfaSettings.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <ShieldExclamationIcon className="w-10 h-10 mx-auto mb-2 text-amber-300" />
                                        <p className="text-gray-600 font-medium">No MFA methods configured</p>
                                        <p className="text-sm text-gray-400 mt-1">This user has not set up any MFA methods</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {mfaSettings.map(mfa => (
                                            <div key={mfa.id} className={`bg-white rounded-xl border p-4 ${mfa.isEnabled ? 'border-green-200' : 'border-gray-100 opacity-60'}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                            mfa.isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                            {mfa.mfaType === 'totp' && <FingerPrintIcon className="w-5 h-5" />}
                                                            {mfa.mfaType === 'sms' && <DevicePhoneMobileIcon className="w-5 h-5" />}
                                                            {mfa.mfaType === 'email' && <EnvelopeIcon className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-gray-900 capitalize">
                                                                    {mfa.mfaType === 'totp' ? 'Authenticator App' : mfa.mfaType}
                                                                </p>
                                                                {mfa.isEnabled && <Badge variant="success" size="sm">Active</Badge>}
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Added {new Date(mfa.createdAt).toLocaleDateString()}
                                                                {mfa.lastUsedAt && ` • Last used ${formatTimeAgo(mfa.lastUsedAt)}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {mfa.isEnabled && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleDisableMFA(mfa.id)}
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            Disable
                                                        </Button>
                                                    )}
                                                </div>
                                                {mfa.backupCodesRemaining !== undefined && (
                                                    <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                                                        Backup codes remaining: <span className="font-medium">{mfa.backupCodesRemaining}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'apps' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {(!user.apps || user.apps.length === 0) ? (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                        <Squares2X2Icon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                        <p className="text-gray-400 font-medium">No applications connected.</p>
                                    </div>
                                ) : user.apps.map(app => (
                                    <div key={app.appId} className="flex items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold shadow-inner mr-4">
                                            {app.appName[0]}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{app.appName}</h4>
                                            <p className="text-xs text-gray-500">Member since {new Date(app.joinedAt).toLocaleDateString()}</p>
                                        </div>
                                        <Badge variant="info" size="sm" className="capitalize">
                                            {app.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'attributes' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <TagIcon className="w-5 h-5" />
                                        Advanced Metadata
                                    </h4>
                                    <p className="text-sm text-blue-100">
                                        These attributes define custom behavior for the user across different app environments.
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <UserAttributesEditor 
                                        attributes={Object.entries(user.attributes || {}).map(([key, value]) => ({ key, value }))}
                                        onChange={attrs => {
                                            const newAttributes = attrs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
                                            handleSave({ attributes: newAttributes });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <MediaPickerModal 
                isOpen={showAvatarPicker}
                onClose={() => setShowAvatarPicker(false)}
                onSelect={(file) => handleSave({ avatarUrl: file.url })}
                title="Update Avatar"
            />
        </Drawer>
    );
};

const TabButton = ({ id, label, icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap shrink-0 ${
            active === id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
        }`}
    >
        {icon}
        {label}
    </button>
);
