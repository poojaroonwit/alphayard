'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../../../contexts/AppContext';
import { adminService } from '../../../../services/adminService';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { AuthFlowSettings } from '../../../../components/appearance/AuthFlowSettings';
import { SecuritySettings } from '../../../../components/appearance/SecuritySettings';
import { BrandingConfig } from '../../../../components/appearance/types';
import { 
    LockClosedIcon, 
    KeyIcon, 
    UserPlusIcon, 
    ShieldCheckIcon,
    GlobeAltIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from '@/hooks/use-toast';
import { MobileGuide } from '../../../../components/ui/MobileGuide';

export default function AuthenticationPage() {
    const { currentApp, refreshApplications } = useApp();
    const [branding, setBranding] = useState<BrandingConfig | null>(null);
    const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'security' | 'social'>('login');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentApp?.settings?.branding) {
            setBranding(currentApp.settings.branding);
        } else {
            // Set minimal branding to prevent infinite loading - using type assertion for simplicity
            setBranding({
                appName: 'Boundary Admin',
                logoUrl: '',
                screens: [],
                typography: {
                    h1: { family: 'Inter', size: 32, weight: '700', lineHeight: 1.2 },
                    h2: { family: 'Inter', size: 24, weight: '600', lineHeight: 1.3 },
                    body: { family: 'Inter', size: 16, weight: '400', lineHeight: 1.5 },
                    caption: { family: 'Inter', size: 14, weight: '400', lineHeight: 1.4 }
                },
                onboarding: {
                    enabled: false,
                    skipButton: true,
                    nextButton: true,
                    prevButton: true
                },
                flows: {
                    login: {
                        screens: [],
                        skipButton: false,
                        nextButton: true,
                        prevButton: false
                    },
                    signup: {
                        screens: [],
                        skipButton: false,
                        nextButton: true,
                        prevButton: false
                    },
                    resetPassword: {
                        screens: [],
                        skipButton: false,
                        nextButton: true,
                        prevButton: false
                    }
                },
                social: {
                    providers: []
                },
                features: {
                    enableChat: false,
                    enableReferral: false,
                    enableDarkMode: true,
                    isMaintenanceMode: false,
                    maintenanceMessage: ''
                },
                navigation: {
                    tabBar: true,
                    drawer: false
                },
                splash: {
                    duration: 2000,
                    image: '',
                    backgroundColor: '#ffffff'
                },
                localization: {
                    defaultLanguage: 'en',
                    supportedLanguages: ['en'],
                    enableRTL: false
                },
                legal: {
                    privacyPolicyUrl: '',
                    termsOfServiceUrl: '',
                    cookiePolicyUrl: '',
                    dataDeletionUrl: '',
                    dataRequestEmail: ''
                },
                support: {
                    supportEmail: '',
                    supportWebsite: ''
                },
                tagging: {
                    enabled: false,
                    tags: []
                }
            } as unknown as BrandingConfig);
        }
    }, [currentApp]);

    const handleSave = async () => {
        if (!currentApp || !branding) return;
        setSaving(true);
        try {
            // Persist the updated branding (which contains flows/auth settings) 
            // to the global app_settings table via the 'branding' key.
            await adminService.upsertApplicationSetting({
                setting_key: 'branding',
                setting_value: branding
            });
            
            toast({ title: "Auth settings saved", description: "Global authentication rules updated." });
            await refreshApplications();
        } catch (error) {
            console.error('[AuthenticationPage] Save failed:', error);
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (!branding) return (
        <div className="p-8 flex justify-center items-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"/>
                <p className="text-gray-500">Loading authentication settings...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                        <LockClosedIcon className="w-6 h-6 text-blue-600" />
                        Auth Policies
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">Configure global login, signup, and security policies for all applications.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <MobileGuide 
                        title="Auth Flow Integration"
                        buttonLabel="Dev Guide"
                        idLabel="Auth System Type"
                        idValue="EAV-based Global Identity"
                        usageExample={`// Initialize auth flow
const auth = await boundary.auth.initialize({
  type: 'global-v2',
  branding: ${JSON.stringify(branding?.flows?.login || {}, null, 2)}
});`}
                        devNote="The shared identity system ensures that a user created in App A can immediately log into App B if permitted by these policies."
                    />
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>

            {/* Banner */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-blue-500/20">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <ShieldCheckIcon className="w-10 h-10" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-lg font-bold">Shared Identity System</h2>
                    <p className="text-blue-100 text-sm mt-1">Changes made here are applied across your entire ecosystem. Ensure your mobile and web clients are updated to respect these new policies.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                    <CheckCircleIcon className="w-5 h-5 text-blue-200" />
                    <span className="text-sm font-bold tracking-tight">Active Coverage</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
                {[
                    { id: 'login', label: 'Login Flow', icon: KeyIcon },
                    { id: 'signup', label: 'Signup Flow', icon: UserPlusIcon },
                    { id: 'security', label: 'Security & MFA', icon: ShieldCheckIcon },
                    { id: 'social', label: 'Social Providers', icon: GlobeAltIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-6 min-h-[400px]">
                {activeTab === 'login' && (
                    <div className="space-y-6">
                        <AuthFlowSettings type="login" config={branding.flows.login} setBranding={setBranding as any} />
                    </div>
                )}
                {activeTab === 'signup' && (
                    <div className="space-y-6">
                        <AuthFlowSettings type="signup" config={branding.flows.signup} setBranding={setBranding as any} />
                    </div>
                )}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <SecuritySettings security={branding.security} setBranding={setBranding as any} />
                    </div>
                )}
                {activeTab === 'social' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SocialProviderCard 
                            name="Google" 
                            description="Allow users to sign in with their Google accounts." 
                            enabled={true} 
                            icon="G"
                        />
                        <SocialProviderCard 
                            name="GitHub" 
                            description="Connect developer accounts via GitHub OAuth." 
                            enabled={true} 
                            icon="GH"
                        />
                        <SocialProviderCard 
                            name="Apple" 
                            description="Mandatory for iOS apps offering social login." 
                            enabled={false} 
                            icon="A"
                        />
                        <SocialProviderCard 
                            name="SSO (SAML/OIDC)" 
                            description="Enterprise single sign-on for corporate clients." 
                            enabled={false} 
                            icon="SSO"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SocialProviderCard({ name, description, enabled, icon }: { name: string, description: string, enabled: boolean, icon: string }) {
    return (
        <Card className="p-6 border-gray-100 hover:border-blue-200 transition-all group">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                    {enabled ? 'Active' : 'Disabled'}
                </div>
            </div>
            <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="text-xs flex-1 border border-gray-100">Configuration</Button>
                <Button variant="ghost" className={`text-xs flex-1 border border-gray-100 ${enabled ? 'text-red-600 hover:bg-red-50' : 'text-blue-600'}`}>
                    {enabled ? 'Disable' : 'Enable'}
                </Button>
            </div>
        </Card>
    );
}
