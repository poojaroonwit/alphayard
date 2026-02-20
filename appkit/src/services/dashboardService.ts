export interface Dashboard {
  id: string
  name: string
  description: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  components: DashboardComponent[]
}

export interface DashboardComponent {
  id: string
  type: 'chart' | 'table' | 'calendar' | 'stats' | 'gallery' | 'text' | 'custom'
  title: string
  dataSource: string
  config: any
  position: { x: number; y: number; w: number; h: number }
}

export interface DataSource {
  id: string
  name: string
  type: 'api' | 'database' | 'static' | 'computed'
  endpoint?: string
  query?: string
  config: any
}

class DashboardService {
  private storageKey = 'appkit_dashboards'
  private dataSourcesKey = 'appkit_data_sources'

  // Dashboard CRUD Operations
  async getDashboards(): Promise<Dashboard[]> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
      
      // Return default dashboards if none exist
      return this.getDefaultDashboards()
    } catch (error) {
      console.error('Error loading dashboards:', error)
      return this.getDefaultDashboards()
    }
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    const dashboards = await this.getDashboards()
    return dashboards.find(d => d.id === id) || null
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const newDashboard: Dashboard = {
      ...dashboard,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const dashboards = await this.getDashboards()
    dashboards.push(newDashboard)
    await this.saveDashboards(dashboards)

    return newDashboard
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    const dashboards = await this.getDashboards()
    const index = dashboards.findIndex(d => d.id === id)
    
    if (index === -1) {
      throw new Error('Dashboard not found')
    }

    dashboards[index] = {
      ...dashboards[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    await this.saveDashboards(dashboards)
    return dashboards[index]
  }

  async deleteDashboard(id: string): Promise<void> {
    const dashboards = await this.getDashboards()
    const filtered = dashboards.filter(d => d.id !== id)
    await this.saveDashboards(filtered)
  }

  async setDefaultDashboard(id: string): Promise<void> {
    const dashboards = await this.getDashboards()
    const updated = dashboards.map(d => ({
      ...d,
      isDefault: d.id === id
    }))
    await this.saveDashboards(updated)
  }

  // Component Operations
  async addComponent(dashboardId: string, component: Omit<DashboardComponent, 'id'>): Promise<DashboardComponent> {
    const newComponent: DashboardComponent = {
      ...component,
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    dashboard.components.push(newComponent)
    await this.updateDashboard(dashboardId, { components: dashboard.components })

    return newComponent
  }

  async updateComponent(dashboardId: string, componentId: string, updates: Partial<DashboardComponent>): Promise<DashboardComponent> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    const componentIndex = dashboard.components.findIndex(c => c.id === componentId)
    if (componentIndex === -1) {
      throw new Error('Component not found')
    }

    dashboard.components[componentIndex] = {
      ...dashboard.components[componentIndex],
      ...updates,
      id: componentId // Ensure ID doesn't change
    }

    await this.updateDashboard(dashboardId, { components: dashboard.components })
    return dashboard.components[componentIndex]
  }

  async deleteComponent(dashboardId: string, componentId: string): Promise<void> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) {
      throw new Error('Dashboard not found')
    }

    dashboard.components = dashboard.components.filter(c => c.id !== componentId)
    await this.updateDashboard(dashboardId, { components: dashboard.components })
  }

  // Data Source Operations
  async getDataSources(): Promise<DataSource[]> {
    try {
      const stored = localStorage.getItem(this.dataSourcesKey)
      if (stored) {
        return JSON.parse(stored)
      }
      return this.getDefaultDataSources()
    } catch (error) {
      console.error('Error loading data sources:', error)
      return this.getDefaultDataSources()
    }
  }

  async createDataSource(dataSource: Omit<DataSource, 'id'>): Promise<DataSource> {
    const newDataSource: DataSource = {
      ...dataSource,
      id: `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const dataSources = await this.getDataSources()
    dataSources.push(newDataSource)
    await this.saveDataSources(dataSources)

    return newDataSource
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource> {
    const dataSources = await this.getDataSources()
    const index = dataSources.findIndex(ds => ds.id === id)
    
    if (index === -1) {
      throw new Error('Data source not found')
    }

    dataSources[index] = {
      ...dataSources[index],
      ...updates,
      id // Ensure ID doesn't change
    }

    await this.saveDataSources(dataSources)
    return dataSources[index]
  }

  async deleteDataSource(id: string): Promise<void> {
    const dataSources = await this.getDataSources()
    const filtered = dataSources.filter(ds => ds.id !== id)
    await this.saveDataSources(filtered)
  }

  // Data Fetching
  async fetchData(dataSourceId: string, params?: any): Promise<any> {
    const dataSources = await this.getDataSources()
    const dataSource = dataSources.find(ds => ds.id === dataSourceId)
    
    if (!dataSource) {
      throw new Error('Data source not found')
    }

    // Mock data fetching based on data source type
    return this.getMockData(dataSource, params)
  }

  // Private Methods
  private async saveDashboards(dashboards: Dashboard[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(dashboards))
  }

  private async saveDataSources(dataSources: DataSource[]): Promise<void> {
    localStorage.setItem(this.dataSourcesKey, JSON.stringify(dataSources))
  }

  private getDefaultDashboards(): Dashboard[] {
    return [
      {
        id: 'default_appkit_overview',
        name: 'AppKit Overview',
        description: 'Main dashboard showing AppKit statistics and recent activity',
        isDefault: true,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        components: [
          {
            id: 'comp_appkit_stats',
            type: 'stats',
            title: 'AppKit Statistics',
            dataSource: 'appkit_stats',
            config: { showTrends: true, layout: 'grid' },
            position: { x: 0, y: 0, w: 6, h: 4 }
          },
          {
            id: 'comp_activity_chart',
            type: 'chart',
            title: 'Activity Chart',
            dataSource: 'activity_data',
            config: { chartType: 'line', showLegend: true },
            position: { x: 6, y: 0, w: 6, h: 4 }
          },
          {
            id: 'comp_recent_content',
            type: 'table',
            title: 'Recent Content',
            dataSource: 'recent_content',
            config: { pageSize: 5, showPagination: false },
            position: { x: 0, y: 4, w: 12, h: 4 }
          }
        ]
      },
      {
        id: 'default_content_management',
        name: 'Content Management',
        description: 'Dashboard for managing AppKit content and media',
        isDefault: false,
        createdAt: '2024-01-16T00:00:00.000Z',
        updatedAt: '2024-01-18T00:00:00.000Z',
        components: [
          {
            id: 'comp_content_table',
            type: 'table',
            title: 'Content Library',
            dataSource: 'content_library',
            config: { pageSize: 10, sortable: true },
            position: { x: 0, y: 0, w: 12, h: 6 }
          },
          {
            id: 'comp_storage_usage',
            type: 'stats',
            title: 'Storage Usage',
            dataSource: 'storage_usage',
            config: { showTrends: true, format: 'bytes' },
            position: { x: 0, y: 6, w: 6, h: 3 }
          },
          {
            id: 'comp_media_gallery',
            type: 'gallery',
            title: 'Recent Media',
            dataSource: 'recent_media',
            config: { itemsPerRow: 4, showCaptions: true },
            position: { x: 6, y: 6, w: 6, h: 3 }
          }
        ]
      }
    ]
  }

  private getDefaultDataSources(): DataSource[] {
    return [
      {
        id: 'appkit_stats',
        name: 'AppKit Statistics',
        type: 'computed',
        config: { 
          metrics: ['totalFamilies', 'totalUsers', 'activeUsers', 'totalContent'],
          timeRange: '30d'
        }
      },
      {
        id: 'activity_data',
        name: 'Activity Data',
        type: 'computed',
        config: { 
          metrics: ['logins', 'contentViews', 'uploads', 'shares'],
          aggregation: 'daily'
        }
      },
      {
        id: 'recent_content',
        name: 'Recent Content',
        type: 'database',
        query: 'SELECT * FROM content ORDER BY created_at DESC LIMIT 10',
        config: { 
          fields: ['title', 'type', 'author', 'created_at', 'status'],
          refreshInterval: 300000 // 5 minutes
        }
      },
      {
        id: 'content_library',
        name: 'Content Library',
        type: 'database',
        query: 'SELECT * FROM content WHERE status = "published"',
        config: { 
          fields: ['title', 'type', 'author', 'created_at', 'views', 'status'],
          pagination: true,
          pageSize: 20
        }
      },
      {
        id: 'storage_usage',
        name: 'Storage Usage',
        type: 'computed',
        config: { 
          metrics: ['totalStorage', 'usedStorage', 'availableStorage'],
          format: 'bytes'
        }
      },
      {
        id: 'recent_media',
        name: 'Recent Media',
        type: 'database',
        query: 'SELECT * FROM media WHERE type IN ("image", "video") ORDER BY created_at DESC LIMIT 12',
        config: { 
          fields: ['filename', 'type', 'size', 'created_at', 'thumbnail_url'],
          includeThumbnails: true
        }
      },
      {
        id: 'user_engagement',
        name: 'User Engagement',
        type: 'computed',
        config: { 
          metrics: ['dailyActiveUsers', 'sessionDuration', 'pageViews', 'bounceRate'],
          timeRange: '7d'
        }
      },
      {
        id: 'active_users',
        name: 'Active Users',
        type: 'computed',
        config: { 
          metrics: ['onlineUsers', 'todayUsers', 'weekUsers', 'monthUsers'],
          realTime: true
        }
      }
    ]
  }

  private async getMockData(dataSource: DataSource, params?: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    switch (dataSource.id) {
      case 'family_stats':
        return {
          totalFamilies: 12,
          totalUsers: 48,
          activeUsers: 32,
          totalContent: 156,
          trends: {
            totalFamilies: { change: 2, direction: 'up' },
            totalUsers: { change: 5, direction: 'up' },
            activeUsers: { change: -1, direction: 'down' },
            totalContent: { change: 8, direction: 'up' }
          }
        }

      case 'activity_data':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Logins',
              data: [45, 52, 38, 61, 55, 42, 48],
              borderColor: '#dc2626'
            },
            {
              label: 'Content Views',
              data: [120, 135, 98, 156, 142, 118, 134],
              borderColor: '#2563eb'
            },
            {
              label: 'Uploads',
              data: [8, 12, 6, 15, 11, 9, 13],
              borderColor: '#16a34a'
            }
          ]
        }

      case 'recent_content':
        return [
          { id: 1, title: 'Family Photo Album', type: 'gallery', author: 'John Doe', created_at: '2024-01-20T10:30:00Z', status: 'published' },
          { id: 2, title: 'Birthday Party Video', type: 'video', author: 'Jane Smith', created_at: '2024-01-19T15:45:00Z', status: 'published' },
          { id: 3, title: 'Family Newsletter', type: 'document', author: 'Mike Johnson', created_at: '2024-01-18T09:15:00Z', status: 'published' },
          { id: 4, title: 'Vacation Photos', type: 'gallery', author: 'Sarah Wilson', created_at: '2024-01-17T14:20:00Z', status: 'published' },
          { id: 5, title: 'Recipe Collection', type: 'document', author: 'Tom Brown', created_at: '2024-01-16T11:00:00Z', status: 'published' }
        ]

      case 'content_library':
        return {
          data: [
            { id: 1, title: 'Family Photo Album', type: 'gallery', author: 'John Doe', created_at: '2024-01-20T10:30:00Z', views: 45, status: 'published' },
            { id: 2, title: 'Birthday Party Video', type: 'video', author: 'Jane Smith', created_at: '2024-01-19T15:45:00Z', views: 32, status: 'published' },
            { id: 3, title: 'Family Newsletter', type: 'document', author: 'Mike Johnson', created_at: '2024-01-18T09:15:00Z', views: 28, status: 'published' },
            { id: 4, title: 'Vacation Photos', type: 'gallery', author: 'Sarah Wilson', created_at: '2024-01-17T14:20:00Z', views: 67, status: 'published' },
            { id: 5, title: 'Recipe Collection', type: 'document', author: 'Tom Brown', created_at: '2024-01-16T11:00:00Z', views: 23, status: 'published' }
          ],
          total: 156,
          page: 1,
          pageSize: 20
        }

      case 'storage_usage':
        return {
          totalStorage: 10737418240, // 10GB
          usedStorage: 6442450944,   // 6GB
          availableStorage: 4294967296, // 4GB
          usagePercentage: 60,
          trends: {
            usedStorage: { change: 524288000, direction: 'up' }, // 500MB increase
            availableStorage: { change: -524288000, direction: 'down' }
          }
        }

      case 'recent_media':
        return [
          { id: 1, filename: 'family_photo_1.jpg', type: 'image', size: 2048576, created_at: '2024-01-20T10:30:00Z', thumbnail_url: '/thumbnails/family_photo_1_thumb.jpg' },
          { id: 2, filename: 'birthday_video.mp4', type: 'video', size: 52428800, created_at: '2024-01-19T15:45:00Z', thumbnail_url: '/thumbnails/birthday_video_thumb.jpg' },
          { id: 3, filename: 'vacation_photo_2.jpg', type: 'image', size: 1536000, created_at: '2024-01-18T09:15:00Z', thumbnail_url: '/thumbnails/vacation_photo_2_thumb.jpg' },
          { id: 4, filename: 'family_photo_3.jpg', type: 'image', size: 1894400, created_at: '2024-01-17T14:20:00Z', thumbnail_url: '/thumbnails/family_photo_3_thumb.jpg' }
        ]

      case 'user_engagement':
        return {
          dailyActiveUsers: 32,
          sessionDuration: 1245, // seconds
          pageViews: 456,
          bounceRate: 0.23,
          trends: {
            dailyActiveUsers: { change: 3, direction: 'up' },
            sessionDuration: { change: 45, direction: 'up' },
            pageViews: { change: 12, direction: 'up' },
            bounceRate: { change: -0.02, direction: 'down' }
          }
        }

      case 'active_users':
        return {
          onlineUsers: 8,
          todayUsers: 32,
          weekUsers: 156,
          monthUsers: 445,
          trends: {
            onlineUsers: { change: 2, direction: 'up' },
            todayUsers: { change: 5, direction: 'up' },
            weekUsers: { change: 12, direction: 'up' },
            monthUsers: { change: 23, direction: 'up' }
          }
        }

      default:
        return { message: 'No data available for this data source' }
    }
  }
}

export const dashboardService = new DashboardService()

