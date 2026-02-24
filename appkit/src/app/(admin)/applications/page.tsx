'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/use-toast'
import { 
  ServerIcon, 
  PlusIcon, 
  SearchIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from 'lucide-react'

interface Application {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'development'
  users: number
  createdAt: string
  lastModified: string
  plan: 'free' | 'pro' | 'enterprise'
  domain?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/admin/applications')
      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }
      
      const data = await response.json()
      
      // Transform API response to component format
      const transformedApplications: Application[] = data.applications.map((app: any) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        status: app.status as Application['status'],
        users: app.userCount || 0,
        createdAt: app.createdAt,
        lastModified: app.updatedAt,
        plan: app.plan as Application['plan'],
        domain: app.domain
      }))
      
      setApplications(transformedApplications)
    } catch (err: any) {
      console.error('Failed to load applications:', err)
      setError('Failed to load applications')
      toast({
        title: 'Error',
        description: 'Failed to load applications. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'development': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanColor = (plan: Application['plan']) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      case 'pro': return 'bg-blue-100 text-blue-800'
      case 'free': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">Manage your applications and their configurations</p>
        </div>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApplications.map((app) => (
          <Card key={app.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ServerIcon className="w-5 h-5 text-gray-500" />
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(app.status)}>
                  {app.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">{app.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Application Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{app.users.toLocaleString()} users</span>
                  </div>
                  <Badge className={getPlanColor(app.plan)}>
                    {app.plan}
                  </Badge>
                </div>

                {/* Domain */}
                {app.domain && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Domain:</span> {app.domain}
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {new Date(app.createdAt).toLocaleDateString()}</div>
                  <div>Modified: {new Date(app.lastModified).toLocaleDateString()}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `/applications/${app.id}`}
                  >
                    <CogIcon className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/applications/${app.id}/users`}
                  >
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first application'}
          </p>
          {!searchQuery && (
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Application
            </Button>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ServerIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Apps</p>
                <p className="text-xl font-bold">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">{applications.filter(a => a.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xl font-bold">{applications.reduce((sum, app) => sum + app.users, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Enterprise</p>
                <p className="text-xl font-bold">{applications.filter(a => a.plan === 'enterprise').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
