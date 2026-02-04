import React, { useState } from 'react';
import { GlobalUser } from '../../services/userService';
import { Card } from '../ui/Card';
import { 
    MagnifyingGlassIcon, 
    FunnelIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';
import { MobileGuide } from '../ui/MobileGuide';

interface UserListProps {
    users: GlobalUser[];
    loading: boolean;
    onUserClick: (user: GlobalUser) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, loading, onUserClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [appFilter, setAppFilter] = useState<string>('all');
    const [attrFilter, setAttrFilter] = useState('');

    // Derive unique apps for filter dropdown
    const allApps = Array.from(new Set(users.flatMap(u => (u.apps || []).map(a => a.appName)))).sort();

    const filteredUsers = users.filter(user => {
        // Text Search
        const matchesSearch = 
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status Filter
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

        // App Filter
        const matchesApp = appFilter === 'all' || (user.apps || []).some(app => app.appName === appFilter);

        // Attribute Filter (format key:value or just key)
        const matchesAttr = !attrFilter || Object.entries(user.attributes || {}).some(([key, value]) => {
            const query = attrFilter.toLowerCase();
            if (query.includes(':')) {
                const [k, v] = query.split(':');
                return key.toLowerCase().includes(k) && value.toLowerCase().includes(v);
            }
            return key.toLowerCase().includes(query) || value.toLowerCase().includes(query);
        });

        return matchesSearch && matchesStatus && matchesApp && matchesAttr;
    });

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="relative w-full xl:w-72 shrink-0">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        placeholder="Search users..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    {/* App Filter */}
                    <select 
                        value={appFilter}
                        onChange={(e) => setAppFilter(e.target.value)}
                        className="h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none min-w-[140px]"
                    >
                        <option value="all">All Apps</option>
                        {allApps.map(app => (
                            <option key={app} value={app}>{app}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-[130px]"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="banned">Banned</option>
                    </select>

                    {/* Attribute Filter */}
                    <div className="relative w-full sm:w-48">
                        <Input 
                            placeholder="Attr (key:value)" 
                            value={attrFilter} 
                            onChange={(e) => setAttrFilter(e.target.value)} 
                            className="h-10 bg-white border-gray-200 text-sm"
                        />
                    </div>

                    <MobileGuide 
                        title="User Management Integration"
                        buttonLabel="Dev Guide"
                        idLabel="Admin API Endpoint"
                        idValue="/api/admin/users"
                        usageExample={`// Fetch all users with filters
const response = await fetch('/api/admin/users', {
    headers: { Authorization: \`Bearer \${token}\` }
});
const { users } = await response.json();`}
                         devNote="The user status mapping is critical. 'isActive' (boolean) maps to 'active/inactive' in the UI. Metadata is stored in the 'metadata' JSONB column."
                    />

                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setAppFilter('all');
                            setAttrFilter('');
                        }}
                        className="h-10 w-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
                        title="Clear Filters"
                    >
                        <FunnelIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Status & Source</th>
                            <th className="px-6 py-3 font-medium">Apps</th>
                            <th className="px-6 py-3 font-medium">Tags</th>
                            <th className="px-6 py-3 font-medium text-right">Added</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr 
                                    key={user.id} 
                                    onClick={() => onUserClick(user)}
                                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                                ) : user.firstName?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{user.firstName} {user.lastName}</div>
                                                <div className="text-gray-500 text-xs">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                                                user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                user.status === 'banned' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                            }`}>
                                                {user.status}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                via {user.source}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center -space-x-2">
                                            {(user.apps || []).slice(0, 3).map((app, i) => (
                                                <div key={i} className="h-8 w-8 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600" title={app.appName}>
                                                    {app.appName[0]}
                                                </div>
                                            ))}
                                            {(user.apps?.length || 0) > 3 && (
                                                <div className="h-8 w-8 rounded-lg border-2 border-white bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                                                    +{(user.apps?.length || 0) - 3}
                                                </div>
                                            )}
                                            {(user.apps?.length || 0) === 0 && <span className="text-gray-300 text-xs italic">None</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(user.tags || []).slice(0, 2).map((tag, i) => (
                                                <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{tag}</span>
                                            ))}
                                            {(user.tags?.length || 0) > 2 && <span className="text-xs text-gray-400">+{(user.tags?.length || 0) - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls (Mock) */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {filteredUsers.length} of {users.length} users</span>
                <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button className="p-1 hover:bg-gray-100 rounded"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </Card>
    );
};
