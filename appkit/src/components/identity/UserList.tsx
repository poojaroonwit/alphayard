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
    selectedUserIds?: string[];
    onSelectUser?: (userId: string) => void;
    showCheckboxes?: boolean;
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    totalUsers?: number;
}

export const UserList: React.FC<UserListProps> = ({ 
    users, 
    loading, 
    onUserClick,
    selectedUserIds = [],
    onSelectUser,
    showCheckboxes = false,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalUsers = 0
}) => {

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-xl">

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            {showCheckboxes && <th className="w-12 px-4 py-3"></th>}
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
                                    {showCheckboxes && <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-100 rounded" /></td>}
                                    <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={showCheckboxes ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr 
                                    key={user.id} 
                                    onClick={() => onUserClick(user)}
                                    className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                                        selectedUserIds.includes(user.id) ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    {showCheckboxes && (
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.includes(user.id)}
                                                onChange={() => onSelectUser?.(user.id)}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                        </td>
                                    )}
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
                <span>Showing {users.length} of {totalUsers} users</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onPageChange?.(currentPage - 1)}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" 
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="flex items-center px-2">Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => onPageChange?.(currentPage + 1)}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                        disabled={currentPage >= totalPages}
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Card>
    );
};
