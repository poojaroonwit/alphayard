'use client'

import { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  BellIcon,
  HeartIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  XMarkIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import { adminService } from '../../services/adminService'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

interface Circle {
  id: string
  name: string
  description: string
  memberCount: number
}

interface EmergencyIncident {
  id: string
  CircleId: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    avatar?: string
  }
  type: 'panic' | 'medical' | 'safety' | 'weather' | 'geofence' | 'check-in'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
  title: string
  message: string
  location: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  }
  timestamp: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolvedAt?: string
  contacts: {
    id: string
    name: string
    phone: string
    relationship: string
    contacted: boolean
    contactedAt?: string
  }[]
  CircleMembers: {
    id: string
    name: string
    role: string
    notified: boolean
    notifiedAt?: string
  }[]
  metadata: {
    deviceInfo?: string
    appVersion?: string
    batteryLevel?: number
    networkType?: string
  }
}

export function CircleSafetyIncidents() {
  const [families, setFamilies] = useState<Circle[]>([])
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCircle, setFilterCircle] = useState('all')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch real families data from API using generic collection endpoint
      const response = await adminService.getCollectionItems('circles')
      const formattedFamilies: Circle[] = (response.entities || []).map((entity: any) => ({
        id: entity.id,
        name: entity.attributes?.name || entity.data?.name || '',
        description: entity.attributes?.description || entity.data?.description || '',
        memberCount: entity.attributes?.member_count || entity.data?.member_count || 0
      }))
      setFamilies(formattedFamilies)
      
      // Load all incidents from all families
      await loadAllIncidents()
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback to empty arrays if API fails
      setFamilies([])
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllIncidents = async () => {
    try {
      // Fetch real safety incidents data from all families
      const incidentsData = await adminService.getSafetyIncidents()
      
      // Transform API data to match component interface
      const formattedIncidents: EmergencyIncident[] = incidentsData.map((incident: any) => ({
        id: incident.id,
        CircleId: incident.Circle_id,
        userId: incident.user_id,
        user: {
          id: incident.user?.id || incident.user_id,
          firstName: incident.user?.first_name || 'Unknown',
          lastName: incident.user?.last_name || 'User',
          email: incident.user?.email || '',
          phone: incident.user?.phone || '',
          avatar: incident.user?.avatar_url || 'https://via.placeholder.com/40'
        },
        type: mapIncidentType(incident.type),
        severity: mapIncidentSeverity(incident.priority),
        status: mapIncidentStatus(incident.status),
        title: incident.title,
        message: incident.message || '',
        location: {
          latitude: incident.location_data?.latitude || 0,
          longitude: incident.location_data?.longitude || 0,
          address: incident.location_data?.address || 'Location not available',
          accuracy: incident.location_data?.accuracy || 0
        },
        timestamp: incident.created_at,
        acknowledgedBy: incident.acknowledged_by,
        acknowledgedAt: incident.acknowledged_at,
        resolvedAt: incident.resolved_at,
        contacts: incident.emergency_contacts || [],
        CircleMembers: incident.Circle_members || [],
        metadata: {
          deviceInfo: incident.device_info,
          appVersion: incident.app_version,
          batteryLevel: incident.battery_level,
          networkType: incident.network_type
        }
      }))

      setIncidents(formattedIncidents)
    } catch (error) {
      console.error('Error loading incidents:', error)
      // Fallback to empty array if API fails
      setIncidents([])
    }
  }

  // Helper functions to map API data to component interface
  const mapIncidentType = (apiType: string): 'panic' | 'medical' | 'safety' | 'weather' | 'geofence' | 'check-in' => {
    switch (apiType) {
      case 'emergency': return 'panic'
      case 'check_in': return 'check-in'
      case 'location_alert': return 'geofence'
      case 'custom': return 'safety'
      default: return 'safety'
    }
  }

  const mapIncidentSeverity = (apiPriority: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (apiPriority) {
      case 'urgent': return 'critical'
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'medium'
    }
  }

  const mapIncidentStatus = (apiStatus: string): 'active' | 'acknowledged' | 'resolved' | 'false_alarm' => {
    switch (apiStatus) {
      case 'active': return 'active'
      case 'resolved': return 'resolved'
      case 'cancelled': return 'false_alarm'
      default: return 'active'
    }
  }

  const handleIncidentClick = (incident: EmergencyIncident) => {
    setSelectedIncident(incident)
    setShowDetails(true)
  }

  const handleAcknowledgeIncident = async (incidentId: string) => {
    try {
      await adminService.acknowledgeSafetyIncident(incidentId)
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              status: 'acknowledged' as const,
              acknowledgedBy: 'Admin',
              acknowledgedAt: new Date().toISOString()
            }
          : incident
      ))
      
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? {
          ...prev,
          status: 'acknowledged' as const,
          acknowledgedBy: 'Admin',
          acknowledgedAt: new Date().toISOString()
        } : null)
      }
    } catch (error) {
      console.error('Error acknowledging incident:', error)
      // You could show a toast notification here
    }
  }

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await adminService.resolveSafetyIncident(incidentId)
      
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              status: 'resolved' as const,
              resolvedAt: new Date().toISOString()
            }
          : incident
      ))
      
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? {
          ...prev,
          status: 'resolved' as const,
          resolvedAt: new Date().toISOString()
        } : null)
      }
    } catch (error) {
      console.error('Error resolving incident:', error)
      // You could show a toast notification here
    }
  }

  const getSeverityVariant = (severity: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getStatusVariant = (status: string): 'error' | 'warning' | 'success' | 'default' => {
    switch (status) {
      case 'active': return 'error'
      case 'acknowledged': return 'warning'
      case 'resolved': return 'success'
      case 'false_alarm': return 'default'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'panic': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'medical': return <HeartIcon className="h-5 w-5 text-red-500" />
      case 'safety': return <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
      case 'weather': return <BellIcon className="h-5 w-5 text-blue-500" />
      case 'geofence': return <MapPinIcon className="h-5 w-5 text-green-500" />
      case 'check-in': return <ClockIcon className="h-5 w-5 text-blue-500" />
      default: return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || incident.type === filterType
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus
    const matchesCircle = filterCircle === 'all' || incident.CircleId === filterCircle
    
    return matchesSearch && matchesType && matchesStatus && matchesCircle
  })

  const getCircleName = (CircleId: string) => {
    const Circle = families.find(f => f.id === CircleId)
    return Circle?.name || 'Unknown Circle'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading safety incidents">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card variant="frosted">
        <CardBody>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BellAlertIcon className="w-8 h-8 text-red-600" />
              Circle Safety Incidents
            </h2>
            <p className="text-sm text-gray-500">Monitor and manage emergency incidents across all families</p>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Incidents</p>
                <p className="text-3xl font-bold text-red-600">
                  {incidents.filter(i => i.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">High Priority</p>
                <p className="text-3xl font-bold text-orange-600">
                  {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <BellIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Acknowledged</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {incidents.filter(i => i.status === 'acknowledged').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resolved</p>
                <p className="text-3xl font-bold text-green-600">
                  {incidents.filter(i => i.status === 'resolved').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="frosted">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCircle}
              onChange={(e) => setFilterCircle(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Families</option>
              {families.map(Circle => (
                <option key={Circle.id} value={Circle.id}>{Circle.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Types</option>
              <option value="panic">Panic</option>
              <option value="medical">Medical</option>
              <option value="safety">Safety</option>
              <option value="weather">Weather</option>
              <option value="geofence">Geofence</option>
              <option value="check-in">Check-in</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
              <option value="false_alarm">False Alarm</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          icon={<ShieldCheckIcon className="h-12 w-12" />}
          title="No incidents found"
          description="No emergency incidents match your current filters."
        />
      ) : (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              Emergency Incidents ({filteredIncidents.length})
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200/50">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-6 hover:bg-gray-50/50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleIncidentClick(incident)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View incident: ${incident.title}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getTypeIcon(incident.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {incident.title}
                          </h4>
                          <Badge variant={getSeverityVariant(incident.severity)} size="sm">
                            {incident.severity}
                          </Badge>
                          <Badge variant={getStatusVariant(incident.status)} size="sm">
                            {incident.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{incident.message}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{incident.user.firstName} {incident.user.lastName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="truncate">{getCircleName(incident.CircleId)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                            <span className="truncate max-w-xs">{incident.location.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{getRelativeTime(incident.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{incident.contacts.length} contacts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleIncidentClick(incident)
                        }}
                        aria-label="View incident details"
                      >
                        <EyeIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {incident.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcknowledgeIncident(incident.id)
                          }}
                          aria-label="Acknowledge incident"
                        >
                          <BellIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                      {incident.status === 'acknowledged' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResolveIncident(incident.id)
                          }}
                          aria-label="Resolve incident"
                        >
                          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Incident Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedIncident?.title}
        size="xl"
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={getSeverityVariant(selectedIncident.severity)}>
                {selectedIncident.severity}
              </Badge>
              <Badge variant={getStatusVariant(selectedIncident.status)}>
                {selectedIncident.status}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatTime(selectedIncident.timestamp)}
              </span>
            </div>

            {/* User Information */}
            <Card variant="default">
              <CardHeader>
                <h4 className="text-base font-semibold text-gray-900">User Information</h4>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedIncident.user.avatar || 'https://via.placeholder.com/60'}
                    alt={selectedIncident.user.firstName}
                    className="h-12 w-12 rounded-full shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 truncate">
                      {selectedIncident.user.firstName} {selectedIncident.user.lastName}
                    </h5>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="truncate">{getCircleName(selectedIncident.CircleId)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="truncate">{selectedIncident.user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DevicePhoneMobileIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{selectedIncident.user.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Incident Details */}
            <Card variant="default">
              <CardHeader>
                <h4 className="text-base font-semibold text-gray-900">Incident Details</h4>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 mb-4">{selectedIncident.message}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedIncident.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Severity:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedIncident.severity}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Status:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedIncident.status}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Timestamp:</span>
                    <span className="ml-2 text-gray-600">{formatTime(selectedIncident.timestamp)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Location Information */}
            <Card variant="default">
              <CardHeader>
                <h4 className="text-base font-semibold text-gray-900">Location Information</h4>
              </CardHeader>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <MapPinIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  <span className="font-medium text-gray-900">Address:</span>
                </div>
                <p className="text-gray-700 mb-4">{selectedIncident.location.address}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Latitude:</span>
                    <span className="ml-2 text-gray-600 font-mono">{selectedIncident.location.latitude}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Longitude:</span>
                    <span className="ml-2 text-gray-600 font-mono">{selectedIncident.location.longitude}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Accuracy:</span>
                    <span className="ml-2 text-gray-600 font-mono">{selectedIncident.location.accuracy}m</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Emergency Contacts */}
            {selectedIncident.contacts.length > 0 && (
              <Card variant="default">
                <CardHeader>
                  <h4 className="text-base font-semibold text-gray-900">Emergency Contacts</h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {selectedIncident.contacts.map((contact) => (
                      <div key={contact.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-900">{contact.name}</h5>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1.5">
                                <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                                <span>{contact.phone}</span>
                              </div>
                              <span>{contact.relationship}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={contact.contacted ? 'success' : 'default'} size="sm">
                              {contact.contacted ? 'Contacted' : 'Not Contacted'}
                            </Badge>
                            {contact.contactedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(contact.contactedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Circle Members */}
            {selectedIncident.CircleMembers.length > 0 && (
              <Card variant="default">
                <CardHeader>
                  <h4 className="text-base font-semibold text-gray-900">Circle Members</h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {selectedIncident.CircleMembers.map((member) => (
                      <div key={member.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-900">{member.name}</h5>
                            <span className="text-sm text-gray-500">{member.role}</span>
                          </div>
                          <div className="text-right">
                            <Badge variant={member.notified ? 'success' : 'default'} size="sm">
                              {member.notified ? 'Notified' : 'Not Notified'}
                            </Badge>
                            {member.notifiedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(member.notifiedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Device Information */}
            {selectedIncident.metadata && (
              <Card variant="default">
                <CardHeader>
                  <h4 className="text-base font-semibold text-gray-900">Device Information</h4>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedIncident.metadata.deviceInfo && (
                      <div>
                        <span className="font-medium text-gray-900">Device:</span>
                        <span className="ml-2 text-gray-600 font-mono">{selectedIncident.metadata.deviceInfo}</span>
                      </div>
                    )}
                    {selectedIncident.metadata.appVersion && (
                      <div>
                        <span className="font-medium text-gray-900">App Version:</span>
                        <span className="ml-2 text-gray-600 font-mono">{selectedIncident.metadata.appVersion}</span>
                      </div>
                    )}
                    {selectedIncident.metadata.batteryLevel && (
                      <div>
                        <span className="font-medium text-gray-900">Battery Level:</span>
                        <span className="ml-2 text-gray-600 font-mono">{selectedIncident.metadata.batteryLevel}%</span>
                      </div>
                    )}
                    {selectedIncident.metadata.networkType && (
                      <div>
                        <span className="font-medium text-gray-900">Network:</span>
                        <span className="ml-2 text-gray-600 font-mono">{selectedIncident.metadata.networkType}</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
              {selectedIncident.status === 'active' && (
                <Button
                  variant="warning"
                  onClick={() => {
                    handleAcknowledgeIncident(selectedIncident.id)
                    setShowDetails(false)
                  }}
                >
                  Acknowledge Incident
                </Button>
              )}
              {selectedIncident.status === 'acknowledged' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleResolveIncident(selectedIncident.id)
                    setShowDetails(false)
                  }}
                >
                  Resolve Incident
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowDetails(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

