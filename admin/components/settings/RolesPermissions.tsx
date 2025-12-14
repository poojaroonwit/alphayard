'use client'

import { useEffect, useState } from 'react'
import { adminService, Role, Permission } from '../../services/adminService'

export function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [r, p] = await Promise.all([adminService.getRoles(), adminService.getPermissions()])
        setRoles(r || [])
        setPerms(p || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addRole = async () => {
    const name = prompt('Role name')
    if (!name) return
    const role = await adminService.createRole({ name, description: '', permissions: [], color: '#111827', isSystem: false })
    setRoles(prev => [...prev, role])
  }

  const togglePerm = async (role: Role, permId: string) => {
    const has = role.permissions.includes(permId)
    const updated = { ...role, permissions: has ? role.permissions.filter(p => p !== permId) : [...role.permissions, permId] }
    const saved = await adminService.updateRole(role.id, { permissions: updated.permissions })
    setRoles(prev => prev.map(r => (r.id === role.id ? saved : r)))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-600">Manage access across admin modules.</p>
          </div>
          <button onClick={addRole} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm">Add Role</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No roles</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase">Role</th>
                {perms.map(p => (
                  <th key={p.id} className="text-left px-4 py-2 text-xs text-gray-500 uppercase whitespace-nowrap">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm font-semibold" style={{ color: role.color }}>{role.name}</td>
                  {perms.map(p => (
                    <td key={p.id} className="px-4 py-2 text-sm">
                      <input type="checkbox" checked={role.permissions.includes(p.id)} onChange={() => togglePerm(role, p.id)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}


