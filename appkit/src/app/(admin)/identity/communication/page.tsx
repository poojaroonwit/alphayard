'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../../../../services/adminService';
import { Button } from '../../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Tabs } from '../../../../components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  DevicePhoneMobileIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure?: boolean;
}

interface IntegrationsConfig {
  smtpMobile?: SMTPConfig;
  smtpAdmin?: SMTPConfig;
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<IntegrationsConfig>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getApplicationSettings();
      const integrationsSetting = response.settings.find((s: any) => s.key === 'integrations');
      
      if (integrationsSetting?.value) {
        setConfig(integrationsSetting.value);
      } else {
        // Initialize with defaults if empty
        setConfig({
          smtpMobile: { host: '', port: 587, user: '', pass: '', from: '', secure: false },
          smtpAdmin: { host: '', port: 587, user: '', pass: '', from: '', secure: false }
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communication settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.upsertApplicationSetting({
        setting_key: 'integrations',
        setting_value: config,
        setting_type: 'json',
        category: 'system',
        description: 'External integration configurations (SMTP, SMS, etc.)',
        is_public: false
      });

      toast({
        title: 'Settings saved',
        description: 'Communication settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save communication settings.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailTest = async (type: 'mobile' | 'admin') => {
    // This assumes there's an API endpoint for testing. 
    // If not, we might need to implement one or just save first.
    // For now, we'll just simulate or try a generic test endpoint if available.
    // Given the current context, we'll just save and show a toast hinting to save first.
    
    setTesting(true);
    // Simulate test delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTesting(false);
    
    toast({
      title: 'Test Email Queued',
      description: `A test email using ${type} configuration would be sent here. (Backend endpoint pending)`, 
    });
  };

  const updateSmtpConfig = (type: 'smtpMobile' | 'smtpAdmin', field: keyof SMTPConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type] || { host: '', port: 587, user: '', pass: '', from: '' },
        [field]: value
      }
    }));
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"/></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
            Communication Channels
          </h1>
          <p className="text-gray-500 text-xs mt-1">Configure email (SMTP) and SMS providers for system notifications.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: 'email', label: 'Email (SMTP)', icon: <EnvelopeIcon className="w-4 h-4" /> },
          { id: 'sms', label: 'SMS (Twilio)', icon: <DevicePhoneMobileIcon className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mobile / Transactional SMTP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="w-5 h-5 text-indigo-500" />
                  Transactional / Mobile SMTP
                </CardTitle>
                <CardDescription>
                  Used for OTPs, detailed notifications, and mobile app-related emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>SMTP Host</Label>
                    <Input 
                      placeholder="smtp.example.com" 
                      value={config.smtpMobile?.host || ''}
                      onChange={(e) => updateSmtpConfig('smtpMobile', 'host', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Port</Label>
                    <Input 
                      type="number" 
                      placeholder="587" 
                      value={config.smtpMobile?.port || 587}
                      onChange={(e) => updateSmtpConfig('smtpMobile', 'port', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Username</Label>
                    <Input 
                      placeholder="user@example.com" 
                      value={config.smtpMobile?.user || ''}
                      onChange={(e) => updateSmtpConfig('smtpMobile', 'user', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••••••" 
                      value={config.smtpMobile?.pass || ''}
                      onChange={(e) => updateSmtpConfig('smtpMobile', 'pass', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>From Address</Label>
                  <Input 
                    placeholder="No Reply <noreply@example.com>" 
                    value={config.smtpMobile?.from || ''}
                    onChange={(e) => updateSmtpConfig('smtpMobile', 'from', e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                   <Button variant="outline" size="sm" onClick={() => handleEmailTest('mobile')} disabled={testing}>
                     <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                     Test Connection
                   </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin / Marketing SMTP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="w-5 h-5 text-purple-500" />
                  Admin / System SMTP
                </CardTitle>
                <CardDescription>
                  Used for admin alerts, reports, and system-wide announcements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>SMTP Host</Label>
                    <Input 
                      placeholder="smtp.example.com" 
                      value={config.smtpAdmin?.host || ''}
                      onChange={(e) => updateSmtpConfig('smtpAdmin', 'host', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Port</Label>
                    <Input 
                      type="number" 
                      placeholder="587" 
                      value={config.smtpAdmin?.port || 587}
                      onChange={(e) => updateSmtpConfig('smtpAdmin', 'port', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Username</Label>
                    <Input 
                      placeholder="admin@example.com" 
                      value={config.smtpAdmin?.user || ''}
                      onChange={(e) => updateSmtpConfig('smtpAdmin', 'user', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••••••" 
                      value={config.smtpAdmin?.pass || ''}
                      onChange={(e) => updateSmtpConfig('smtpAdmin', 'pass', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>From Address</Label>
                  <Input 
                    placeholder="Admin <admin@example.com>" 
                    value={config.smtpAdmin?.from || ''}
                    onChange={(e) => updateSmtpConfig('smtpAdmin', 'from', e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                   <Button variant="outline" size="sm" onClick={() => handleEmailTest('admin')} disabled={testing}>
                     <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                     Test Connection
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Twilio Configuration</CardTitle>
              <CardDescription>Configure SMS provider for mobile verification codes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input 
                  placeholder="AC..." 
                  value={config.twilio?.accountSid || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, twilio: { ...prev.twilio!, accountSid: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••••••" 
                  value={config.twilio?.authToken || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, twilio: { ...prev.twilio!, authToken: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label>From Number</Label>
                <Input 
                  placeholder="+1234567890" 
                  value={config.twilio?.fromNumber || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, twilio: { ...prev.twilio!, fromNumber: e.target.value } }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
