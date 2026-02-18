'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit2, 
  RefreshCw,
  Shield,
  Key,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  History,
  Users,
  UserX,
  ExternalLink,
  Info
} from 'lucide-react';
import { authService } from '@/services/authService';
import { API_BASE_URL } from '@/services/apiConfig';
import { useToast } from '@/hooks/use-toast';

// Local API Client wrapper
const apiClient = {
  get: async (endpoint: string) => {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw { response: { data: error } };
    }
    return { data: await res.json() };
  },
  post: async (endpoint: string, body?: any) => {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw { response: { data: error } };
    }
    return { data: await res.json() };
  },
  put: async (endpoint: string, body?: any) => {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw { response: { data: error } };
    }
    return { data: await res.json() };
  },
  delete: async (endpoint: string) => {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw { response: { data: error } };
    }
    return { data: await res.json() };
  }
};

interface OAuthClient {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  homepage_url?: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  client_type: 'confidential' | 'public';
  redirect_uris: string[];
  allowed_scopes: string[];
  default_scopes: string[];
  grant_types: string[];
  access_token_lifetime: number;
  refresh_token_lifetime: number;
  require_pkce: boolean;
  require_consent: boolean;
  first_party: boolean;
  is_active: boolean;
  consent_count?: number;
  created_at: string;
  updated_at: string;
}

interface CreateClientForm {
  name: string;
  description: string;
  logo_url: string;
  homepage_url: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
  client_type: 'confidential' | 'public';
  redirect_uris: string;
  allowed_scopes: string[];
  default_scopes: string[];
  grant_types: string[];
  access_token_lifetime: number;
  refresh_token_lifetime: number;
  require_pkce: boolean;
  require_consent: boolean;
  first_party: boolean;
}

interface UserConsent {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  granted_scopes: string[];
  granted_at: string;
  revoked_at?: string;
}

interface AuditLogEntry {
  id: string;
  client_id: string;
  client_name: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

const AVAILABLE_SCOPES = [
  { value: 'openid', label: 'OpenID', description: 'Basic identity' },
  { value: 'profile', label: 'Profile', description: 'User profile info' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'offline_access', label: 'Offline Access', description: 'Refresh tokens' },
];

const AVAILABLE_GRANT_TYPES = [
  { value: 'authorization_code', label: 'Authorization Code' },
  { value: 'refresh_token', label: 'Refresh Token' },
  { value: 'client_credentials', label: 'Client Credentials' },
];

const DEFAULT_FORM_STATE: CreateClientForm = {
  name: '',
  description: '',
  logo_url: '',
  homepage_url: '',
  privacy_policy_url: '',
  terms_of_service_url: '',
  client_type: 'confidential',
  redirect_uris: '',
  allowed_scopes: ['openid', 'profile', 'email'],
  default_scopes: ['openid', 'profile'],
  grant_types: ['authorization_code', 'refresh_token'],
  access_token_lifetime: 3600,
  refresh_token_lifetime: 2592000,
  require_pkce: true,
  require_consent: true,
  first_party: false,
};

export default function OAuthClientsPage() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<OAuthClient | null>(null);
  const [newClientSecret, setNewClientSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState<CreateClientForm>(DEFAULT_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Consents & Audit Logs
  const [isConsentsDialogOpen, setIsConsentsDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const url = searchQuery 
        ? `/admin/oauth-clients?search=${encodeURIComponent(searchQuery)}`
        : '/admin/oauth-clients';
      const response = await apiClient.get(url);
      setClients(response.data.data || response.data.clients || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load OAuth clients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = async () => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        redirect_uris: formData.redirect_uris.split('\n').map(uri => uri.trim()).filter(Boolean),
      };
      
      const response = await apiClient.post('/admin/oauth-clients', payload);
      const newClient = response.data.client || response.data;
      
      if (newClient.client_secret || response.data.client_secret) {
        setNewClientSecret(newClient.client_secret || response.data.client_secret);
        setSelectedClient(newClient);
        setIsCreateDialogOpen(false);
        setIsSecretDialogOpen(true);
      } else {
        setIsCreateDialogOpen(false);
        toast({
          title: 'Success',
          description: 'OAuth client created successfully',
        });
      }
      
      setFormData(DEFAULT_FORM_STATE);
      fetchClients();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create OAuth client',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;
    
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        redirect_uris: formData.redirect_uris.split('\n').map(uri => uri.trim()).filter(Boolean),
      };
      
      await apiClient.put(`/admin/oauth-clients/${selectedClient.id}`, payload);
      
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setFormData(DEFAULT_FORM_STATE);
      fetchClients();
      
      toast({
        title: 'Success',
        description: 'OAuth client updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update OAuth client',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateSecret = async (clientId: string) => {
    try {
      const response = await apiClient.post(`/admin/oauth-clients/${clientId}/regenerate-secret`);
      
      setNewClientSecret(response.data.client_secret);
      setSelectedClient(clients.find(c => c.id === clientId) || null);
      setIsSecretDialogOpen(true);
      
      toast({
        title: 'Success',
        description: 'Client secret regenerated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to regenerate secret',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this OAuth client? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.delete(`/admin/oauth-clients/${clientId}`);
      fetchClients();
      
      toast({
        title: 'Success',
        description: 'OAuth client deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete OAuth client',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeAllTokens = async (clientId: string) => {
    if (!confirm('Are you sure you want to revoke all tokens for this client? All active sessions will be invalidated.')) {
      return;
    }
    
    try {
      await apiClient.post(`/admin/oauth-clients/${clientId}/revoke-all-tokens`);
      
      toast({
        title: 'Success',
        description: 'All tokens revoked successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to revoke tokens',
        variant: 'destructive',
      });
    }
  };

  const fetchConsents = async (client: OAuthClient) => {
    try {
      setLoadingModalData(true);
      setSelectedClient(client);
      setIsConsentsDialogOpen(true);
      const response = await apiClient.get(`/admin/oauth-clients/${client.id}/consents`);
      setConsents(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load user consents',
        variant: 'destructive',
      });
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleRevokeConsent = async (userId: string) => {
    if (!selectedClient || !confirm('Revoke access for this user? They will need to re-authorize.')) return;
    
    try {
      await apiClient.delete(`/admin/oauth-clients/${selectedClient.id}/consents/${userId}`);
      setConsents(prev => prev.filter(c => c.user_id !== userId));
      toast({
        title: 'Success',
        description: 'User access revoked',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  const fetchAuditLogs = async (clientId?: string) => {
    try {
      setLoadingModalData(true);
      setIsAuditDialogOpen(true);
      const url = clientId 
        ? `/admin/oauth-clients/audit-log?client_id=${clientId}`
        : '/admin/oauth-clients/audit-log';
      const response = await apiClient.get(url);
      setAuditLogs(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoadingModalData(false);
    }
  };

  const openEditDialog = (client: OAuthClient) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      description: client.description || '',
      logo_url: client.logo_url || '',
      homepage_url: client.homepage_url || '',
      privacy_policy_url: client.privacy_policy_url || '',
      terms_of_service_url: client.terms_of_service_url || '',
      client_type: client.client_type,
      redirect_uris: client.redirect_uris.join('\n'),
      allowed_scopes: client.allowed_scopes,
      default_scopes: client.default_scopes,
      grant_types: client.grant_types,
      access_token_lifetime: client.access_token_lifetime,
      refresh_token_lifetime: client.refresh_token_lifetime,
      require_pkce: client.require_pkce,
      require_consent: client.require_consent,
      first_party: client.first_party,
    });
    setIsEditDialogOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds || 0}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OAuth Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage OAuth 2.0 / OpenID Connect clients for Single Sign-On
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
            />
          </div>
          <Button variant="outline" onClick={() => fetchAuditLogs()}>
            <History className="mr-2 h-4 w-4" />
            Audit Log
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create OAuth Client</DialogTitle>
                <DialogDescription>
                  Create a new OAuth 2.0 client for third-party application integration
                </DialogDescription>
              </DialogHeader>
              <ClientForm 
                formData={formData} 
                setFormData={setFormData}
                isEdit={false}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClient} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Client'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Clients</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.client_type === 'public').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Party</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter(c => c.first_party).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Clients</CardTitle>
          <CardDescription>
            Applications authorized to use your SSO provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No OAuth Clients</h3>
              <p className="text-muted-foreground mt-1">
                Create your first OAuth client to enable SSO for third-party applications
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Token TTL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{client.name}</span>
                        {client.first_party && (
                          <Badge variant="info" className="text-xs">
                            First Party
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {client.client_id.substring(0, 16)}...
                        </code>
                        <Button
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(client.client_id, 'Client ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.client_type === 'public' ? 'default' : 'info'}>
                        {client.client_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.allowed_scopes.slice(0, 3).map((scope) => (
                          <Badge key={scope} variant="default" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                        {client.allowed_scopes.length > 3 && (
                          <Badge variant="default" className="text-xs">
                            +{client.allowed_scopes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(client.access_token_lifetime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.is_active ? (
                        <Badge variant="success">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="error" className="bg-red-500/10 text-red-700 hover:bg-red-500/20">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchConsents(client)}>
                            <Users className="mr-2 h-4 w-4" />
                            Assigned Users
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => fetchAuditLogs(client.id)}>
                            <History className="mr-2 h-4 w-4" />
                            View Audit Log
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(client.client_id, 'Client ID')}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Client ID
                          </DropdownMenuItem>
                          {client.client_type === 'confidential' && (
                            <DropdownMenuItem onClick={() => handleRegenerateSecret(client.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Regenerate Secret
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRevokeAllTokens(client.id)}
                            className="text-orange-600"
                            >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Revoke All Tokens
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit OAuth Client</DialogTitle>
            <DialogDescription>
              Update the configuration for {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <ClientForm 
            formData={formData} 
            setFormData={setFormData}
            isEdit={true}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClient} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consents Dialog */}
      <Dialog open={isConsentsDialogOpen} onOpenChange={setIsConsentsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Consents: {selectedClient?.name}</DialogTitle>
            <DialogDescription>
              Users who have authorized this application to access their data
            </DialogDescription>
          </DialogHeader>
          
          {loadingModalData ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : consents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users have authorized this client yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Granted Scopes</TableHead>
                    <TableHead>Authorized On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((consent) => (
                    <TableRow key={consent.id}>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{consent.user_name}</span>
                          <span className="text-muted-foreground">{consent.user_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {consent.granted_scopes.map(s => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(consent.granted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 h-8 w-8 p-0"
                          onClick={() => handleRevokeConsent(consent.user_id)}
                          title="Revoke User Access"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Logs Dialog */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>OAuth Audit Logs</DialogTitle>
            <DialogDescription>
              Security and configuration change history
            </DialogDescription>
          </DialogHeader>

          {loadingModalData ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {log.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.client_name}</TableCell>
                      <TableCell>{log.user_email || '-'}</TableCell>
                      <TableCell>{log.ip_address || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Client Form Component
function ClientForm({ 
  formData, 
  setFormData,
  isEdit 
}: { 
  formData: CreateClientForm; 
  setFormData: React.Dispatch<React.SetStateAction<CreateClientForm>>;
  isEdit: boolean;
}) {
  const toggleScope = (scope: string, type: 'allowed' | 'default') => {
    const field = type === 'allowed' ? 'allowed_scopes' : 'default_scopes';
    const currentScopes = formData[field];
    
    if (currentScopes.includes(scope)) {
      setFormData(prev => ({
        ...prev,
        [field]: currentScopes.filter(s => s !== scope)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentScopes, scope]
      }));
    }
  };

  const toggleGrantType = (grantType: string) => {
    const current = formData.grant_types;
    if (current.includes(grantType)) {
      setFormData(prev => ({
        ...prev,
        grant_types: current.filter(g => g !== grantType)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        grant_types: [...current, grantType]
      }));
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Client Name</Label>
          <Input
            id="name"
            placeholder="My Application"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="homepage_url">Homepage URL</Label>
          <Input
            id="homepage_url"
            placeholder="https://myapp.com"
            value={formData.homepage_url}
            onChange={(e) => setFormData(prev => ({ ...prev, homepage_url: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A brief description of the client..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            placeholder="https://myapp.com/logo.png"
            value={formData.logo_url}
            onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_type">Client Type</Label>
          <Select
            value={formData.client_type}
            onValueChange={(value: string) => 
              setFormData(prev => ({ ...prev, client_type: value as 'confidential' | 'public' }))
            }
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confidential">
                Confidential (server-side)
              </SelectItem>
              <SelectItem value="public">
                Public (SPA/Mobile)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
          <Input
            id="privacy_policy_url"
            placeholder="https://myapp.com/privacy"
            value={formData.privacy_policy_url}
            onChange={(e) => setFormData(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
          <Input
            id="terms_of_service_url"
            placeholder="https://myapp.com/terms"
            value={formData.terms_of_service_url}
            onChange={(e) => setFormData(prev => ({ ...prev, terms_of_service_url: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="redirect_uris">Redirect URIs</Label>
        <Textarea
          id="redirect_uris"
          placeholder="https://myapp.com/callback&#10;https://myapp.com/auth/callback"
          value={formData.redirect_uris}
          onChange={(e) => setFormData(prev => ({ ...prev, redirect_uris: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          One URI per line. These are the allowed callback URLs.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Allowed Scopes</Label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_SCOPES.map((scope) => (
            <div 
              key={scope.value}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.allowed_scopes.includes(scope.value) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => toggleScope(scope.value, 'allowed')}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{scope.label}</div>
                <div className="text-xs text-muted-foreground">{scope.description}</div>
              </div>
              {formData.allowed_scopes.includes(scope.value) && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Grant Types</Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_GRANT_TYPES.map((grant) => (
            <Badge
              key={grant.value}
              variant={formData.grant_types.includes(grant.value) ? 'default' : 'info'}
              className="cursor-pointer"
              onClick={() => toggleGrantType(grant.value)}
            >
              {grant.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="access_token_lifetime">Access Token Lifetime (seconds)</Label>
          <Input
            id="access_token_lifetime"
            type="number"
            value={formData.access_token_lifetime}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              access_token_lifetime: parseInt(e.target.value) || 3600 
            }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refresh_token_lifetime">Refresh Token Lifetime (seconds)</Label>
          <Input
            id="refresh_token_lifetime"
            type="number"
            value={formData.refresh_token_lifetime}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              refresh_token_lifetime: parseInt(e.target.value) || 2592000 
            }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require PKCE</Label>
            <p className="text-xs text-muted-foreground">Force Proof Key for Code Exchange</p>
          </div>
          <Switch
            checked={formData.require_pkce}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_pkce: checked }))}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Consent</Label>
            <p className="text-xs text-muted-foreground">Show consent screen to users</p>
          </div>
          <Switch
            checked={formData.require_consent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_consent: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>First Party App</Label>
            <p className="text-xs text-muted-foreground">Internal application (skips consent)</p>
          </div>
          <Switch
            checked={formData.first_party}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, first_party: checked }))}
          />
        </div>
      </div>
    </div>
  );
}
