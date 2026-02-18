'use client'

import { useState, useEffect } from 'react'
import { 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  FlagIcon,
  TrashIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { socialMediaService, Circle, SocialPost, SocialComment, SocialReport, SocialActivity } from '../../services/socialMediaService'
import { adminService } from '../../services/adminService'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

// Interfaces are now imported from the service

export function SocialMedia() {
  const [families, setFamilies] = useState<Circle[]>([])
  const [selectedCircle, setSelectedCircle] = useState<string>('all')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [comments, setComments] = useState<SocialComment[]>([])
  const [reports, setReports] = useState<SocialReport[]>([])
  const [activities, setActivities] = useState<SocialActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterReported, setFilterReported] = useState('all')
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [showModerationModal, setShowModerationModal] = useState(false)
  const [moderationAction, setModerationAction] = useState<'hide' | 'delete' | 'approve'>('hide')
  const [moderationReason, setModerationReason] = useState('')
  const [notifyUser, setNotifyUser] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCircle) {
      loadSocialMediaData()
    }
  }, [selectedCircle])

  const loadData = async () => {
    setLoading(true)
    try {
      // Use generic collection endpoint instead of socialMediaService.getFamilies()
      const response = await adminService.getCollectionItems('circles')
      const familiesData: Circle[] = (response.entities || []).map((entity: any) => ({
        id: entity.id,
        name: entity.attributes?.name || entity.data?.name || '',
        description: entity.attributes?.description || entity.data?.description,
        memberCount: entity.attributes?.member_count || entity.data?.member_count || 0
      }))
      const allFamiliesOption: Circle = { 
        id: 'all', 
        name: 'All Families', 
        description: 'View all families', 
        memberCount: 0 
      }
      setFamilies([allFamiliesOption, ...familiesData])
      setSelectedCircle('all')
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSocialMediaData = async () => {
    try {
      // Load posts with filters
      const postsData = await socialMediaService.getPosts({
        circleId: selectedCircle,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        reported: filterReported === 'reported' ? true : filterReported === 'not_reported' ? false : undefined,
        search: searchTerm || undefined
      })

      // Load comments for all posts
      const commentsData = await socialMediaService.getComments(postsData[0]?.id || '')
      
      // Load reports
      const reportsData = await socialMediaService.getReports()
      
      // Load activities for all posts
      const activitiesData = await socialMediaService.getActivities(postsData[0]?.id || '')

      setPosts(postsData)
      setComments(commentsData)
      setReports(reportsData)
      setActivities(activitiesData)
    } catch (error) {
      console.error('Error loading social media data:', error)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesCircle = selectedCircle === 'all' || post.circleId === selectedCircle
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.author?.firstName + ' ' + post.author?.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus
    const matchesType = filterType === 'all' || post.type === filterType
    const matchesReported = filterReported === 'all' || 
                           (filterReported === 'reported' && post.isReported) ||
                           (filterReported === 'not_reported' && !post.isReported)
    return matchesCircle && matchesSearch && matchesStatus && matchesType && matchesReported
  })

  const handleModeratePost = (post: SocialPost, action: 'hide' | 'delete' | 'approve') => {
    setSelectedPost(post)
    setModerationAction(action)
    setModerationReason('')
    setNotifyUser(true)
    setShowModerationModal(true)
  }

  const handleConfirmModeration = async () => {
    if (!selectedPost) return

    try {
      let updates: any = {}
      
      if (moderationAction === 'hide') {
        updates = { isHidden: true, status: 'hidden' }
      } else if (moderationAction === 'delete') {
        updates = { isDeleted: true, status: 'deleted' }
      } else if (moderationAction === 'approve') {
        updates = { isHidden: false, status: 'active' }
      }

      const updatedPost = await socialMediaService.updatePost(selectedPost.id, updates)
      
      setPosts(prev => prev.map(post => 
        post.id === selectedPost.id ? updatedPost : post
      ))

      // TODO: Send notification to user if notifyUser is true
      if (notifyUser && moderationAction !== 'approve') {
        // Send notification about moderation action
        console.log(`Notifying user about ${moderationAction}: ${moderationReason}`)
      }

      setShowModerationModal(false)
      setSelectedPost(null)
    } catch (error) {
      console.error('Error moderating post:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'hidden': return 'yellow'
      case 'deleted': return 'red'
      case 'under_review': return 'blue'
      default: return 'gray'
    }
  }

  const getReportReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam': return 'yellow'
      case 'inappropriate': return 'orange'
      case 'harassment': return 'red'
      case 'violence': return 'red'
      case 'other': return 'gray'
      default: return 'gray'
    }
  }

  const getSelectedCircleName = () => {
    const Circle = families.find(f => f.id === selectedCircle)
    return Circle?.name || 'All Families'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading social media data">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card variant="frosted">
        <CardBody>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media Management</h2>
            <p className="text-sm text-gray-500">Monitor posts, comments, reports, and moderate content</p>
          </div>
        </CardBody>
      </Card>

      {/* Circle Selection */}
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Select Circle</label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              {families.map(Circle => (
                <option key={Circle.id} value={Circle.id}>
                  {Circle.name}{Circle.memberCount > 0 ? ` (${Circle.memberCount} members)` : ''}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Social Media Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Posts</p>
                <p className="text-3xl font-bold text-blue-600">{posts.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShareIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Posts</p>
                <p className="text-3xl font-bold text-green-600">
                  {posts.filter(p => p.status === 'active').length}
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reported Posts</p>
                <p className="text-3xl font-bold text-red-600">
                  {posts.filter(p => p.isReported).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FlagIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Engagement</p>
                <p className="text-3xl font-bold text-orange-600">
                  {posts.reduce((sum, post) => sum + (post.likesCount || 0) + (post.sharesCount || 0) + (post.commentsCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
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
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search posts, users, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
              <option value="deleted">Deleted</option>
              <option value="under_review">Under Review</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="event">Event</option>
            </select>
            <select
              value={filterReported}
              onChange={(e) => setFilterReported(e.target.value)}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Posts</option>
              <option value="reported">Reported</option>
              <option value="not_reported">Not Reported</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <EmptyState
          icon={<ShareIcon className="h-12 w-12" />}
          title="No posts found"
          description={searchTerm ? 'Try adjusting your search terms.' : 'No posts available for the selected Circle.'}
        />
      ) : (
        <Card variant="frosted">
          <CardBody>
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} variant="default" hoverable>
                  <CardBody>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            {post.author?.avatarUrl ? (
                              <img src={post.author.avatarUrl} alt={`${post.author.firstName} ${post.author.lastName}`} className="w-10 h-10 rounded-full" />
                            ) : (
                              <UserIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-base font-semibold text-gray-900 truncate">{post.author?.firstName} {post.author?.lastName}</h4>
                              <Badge variant="info" size="sm">{post.circle?.name}</Badge>
                              <Badge variant={getStatusColor(post.status) === 'green' ? 'success' : getStatusColor(post.status) === 'yellow' ? 'warning' : getStatusColor(post.status) === 'red' ? 'error' : 'default'} size="sm">
                                {post.status.replace('_', ' ')}
                              </Badge>
                              {post.isReported && (
                                <Badge variant="error" size="sm">Reported ({post.reportCount})</Badge>
                              )}
                              {post.isHidden && (
                                <Badge variant="warning" size="sm">Hidden</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <EyeIcon className="h-4 w-4" aria-hidden="true" />
                                {post.viewsCount} views
                              </span>
                              <span className="flex items-center gap-1.5">
                                <UsersIcon className="h-4 w-4" aria-hidden="true" />
                                {post.visibility}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-800">{post.content}</p>
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {post.mediaUrls.map((url, index) => (
                                <img key={index} src={url} alt={`Media ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <HeartIcon className="h-4 w-4" aria-hidden="true" />
                            {post.likesCount} likes
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ShareIcon className="h-4 w-4" aria-hidden="true" />
                            {post.sharesCount} shares
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
                            {post.commentsCount} comments
                          </span>
                        </div>
                        
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.tags.map(tag => (
                              <Badge key={tag} variant="info" size="sm">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowPostDetail(true);
                          }}
                          aria-label="View post details"
                        >
                          <EyeIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {post.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleModeratePost(post, 'hide')}
                            aria-label="Hide post"
                          >
                            <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        {post.status === 'hidden' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleModeratePost(post, 'approve')}
                            aria-label="Approve post"
                          >
                            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModeratePost(post, 'delete')}
                          aria-label="Delete post"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Post Detail Modal */}
      <Modal
        isOpen={showPostDetail}
        onClose={() => setShowPostDetail(false)}
        title="Post Details"
        size="xl"
      >
        {selectedPost && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Post Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Author:</span>
                  <span>{selectedPost.author?.firstName} {selectedPost.author?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Circle:</span>
                  <span>{selectedPost.circle?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span>{selectedPost.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`badge badge-${getStatusColor(selectedPost.status)}`}>
                    {selectedPost.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Visibility:</span>
                  <span>{selectedPost.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{new Date(selectedPost.createdAt).toLocaleString()}</span>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-2 mt-4">Engagement</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-red-500">{selectedPost.likesCount}</div>
                  <div className="text-gray-500">Likes</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-blue-500">{selectedPost.sharesCount}</div>
                  <div className="text-gray-500">Shares</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-green-500">{selectedPost.commentsCount}</div>
                  <div className="text-gray-500">Comments</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-lg font-semibold text-purple-500">{selectedPost.viewsCount}</div>
                  <div className="text-gray-500">Views</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Reports</h4>
              {reports.filter(r => r.postId === selectedPost.id).length > 0 ? (
                <div className="space-y-2">
                  {reports.filter(r => r.postId === selectedPost.id).map(report => (
                    <div key={report.id} className="border border-gray-200 rounded p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{report.reporter?.firstName} {report.reporter?.lastName}</span>
                        <span className={`badge badge-${getReportReasonColor(report.reason)}`}>
                          {report.reason}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reports for this post</p>
              )}
              
              <h4 className="font-medium text-gray-900 mb-2 mt-4">Recent Activity</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.filter(a => a.postId === selectedPost.id).slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                    <span className="text-gray-500">{activity.action}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Moderation Modal */}
      {showModerationModal && selectedPost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                  {moderationAction === 'hide' ? 'Hide Post' : 
                   moderationAction === 'delete' ? 'Delete Post' : 
                   'Approve Post'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Reason (optional)</label>
                    <textarea
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      className="form-input"
                      rows={3}
                      placeholder="Enter reason for this action..."
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notifyUser}
                      onChange={(e) => setNotifyUser(e.target.checked)}
                      className="form-checkbox mr-2"
                    />
                    <label className="text-sm">Notify user about this action</label>
                  </div>
                  
                  {notifyUser && moderationReason && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        User will be notified: "{moderationReason}"
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleConfirmModeration}
                    className={`btn ${
                      moderationAction === 'delete' ? 'btn-danger' : 
                      moderationAction === 'hide' ? 'btn-warning' : 
                      'btn-success'
                    }`}
                  >
                    {moderationAction === 'hide' ? 'Hide Post' : 
                     moderationAction === 'delete' ? 'Delete Post' : 
                     'Approve Post'}
                  </button>
                  <button
                    onClick={() => setShowModerationModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

