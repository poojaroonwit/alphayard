'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon,
  CalendarIcon,
  DocumentIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  PhotoIcon,
  CloudIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { adminService, Family } from '../../services/adminService'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

interface FamiliesListProps {
  onFamilyClick?: (familyId: string) => void
}

export function FamiliesList({ onFamilyClick }: FamiliesListProps) {
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [showFamilyDetail, setShowFamilyDetail] = useState(false)

  useEffect(() => {
    loadFamilies()
  }, [])

  const loadFamilies = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSocialMediaFamilies()
      setFamilies(data)
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFamilies = families.filter(family => {
    const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (family.description && family.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (family.owner?.first_name && family.owner.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (family.owner?.last_name && family.owner.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && family.is_active) ||
                          (filterStatus === 'inactive' && !family.is_active)
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'yellow'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'family': return '👨‍👩‍👧‍👦'
      case 'friends': return '👥'
      case 'sharehouse': return '🏠'
      default: return '❓'
    }
  }

  const handleFamilyClick = (family: Family) => {
    if (onFamilyClick) {
      onFamilyClick(family.id)
    } else {
      setSelectedFamily(family)
      setShowFamilyDetail(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading families">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card variant="frosted">
        <CardBody>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Families Management</h2>
              <p className="text-sm text-gray-500">Manage and monitor all families in the system</p>
            </div>
            <Button variant="primary" onClick={() => {}}>
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Family
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Families</p>
                <p className="text-3xl font-bold text-gray-900">{families.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {families.filter(f => f.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Members</p>
                <p className="text-3xl font-bold text-blue-600">
                  {families.reduce((sum, f) => sum + f.member_count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Inactive</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {families.filter(f => !f.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="frosted">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search"
              type="text"
              placeholder="Search families..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
            <div className="flex items-end">
              <Button variant="secondary" className="w-full">
                <FunnelIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Families Table */}
      {filteredFamilies.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-8 w-8" />}
          title="No families found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Family</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFamilies.map((family) => (
              <TableRow key={family.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {family.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{family.name}</div>
                      <div className="text-sm text-gray-500 truncate">{family.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {family.owner ? `${family.owner.first_name} ${family.owner.last_name}` : 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{family.owner?.email || 'No email'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-900">{family.member_count}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={family.is_active ? 'success' : 'warning'}>
                    {family.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{getTypeIcon(family.type)}</span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{family.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {new Date(family.updated_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFamilyClick(family)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      aria-label="View Family"
                    >
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      aria-label="Edit Family"
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      aria-label="Delete Family"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Family Detail Modal */}
      <Modal
        isOpen={showFamilyDetail}
        onClose={() => setShowFamilyDetail(false)}
        title={selectedFamily?.name}
        size="xl"
      >
        {selectedFamily && (
          <div className="space-y-6">
            <div className="text-sm text-gray-500">Family ID: {selectedFamily.id}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="default">
                <CardBody>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <p className="text-gray-600">{selectedFamily.description || 'No description provided'}</p>
                </CardBody>
              </Card>
              <Card variant="default">
                <CardBody>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <Badge variant={selectedFamily.is_active ? 'success' : 'warning'}>
                    {selectedFamily.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </CardBody>
              </Card>
              <Card variant="default">
                <CardBody>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Owner</label>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedFamily.owner ? `${selectedFamily.owner.first_name} ${selectedFamily.owner.last_name}` : 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{selectedFamily.owner?.email || 'No email'}</div>
                  </div>
                </CardBody>
              </Card>
              <Card variant="default">
                <CardBody>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Member Count</label>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="font-semibold text-gray-900 text-lg">{selectedFamily.member_count}</span>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card variant="default">
              <CardBody>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Family Type</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{getTypeIcon(selectedFamily.type)}</span>
                  <span className="text-lg font-medium text-gray-700 capitalize">{selectedFamily.type}</span>
                </div>
              </CardBody>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
              <Button variant="secondary" onClick={() => setShowFamilyDetail(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  console.log('Navigate to family:', selectedFamily.id)
                  setShowFamilyDetail(false)
                }}
              >
                View Family Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
