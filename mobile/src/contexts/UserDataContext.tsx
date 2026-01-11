import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api, safetyApi, locationApi } from '../services/api';
import { emotionService, EmotionRecord } from '../services/emotionService';
import { locationService, FamilyLocation } from '../services/location/locationService';

// Define types based on what was in HomeScreen
export interface FamilyMember {
    id: string;
    name: string;
    userName: string;
    role: string;
    notifications: number;
    lastLocationUpdate: string;
    address?: string;
    placeLabel?: string;
    isOnline: boolean;
    avatar?: string;

    // Status fields
    status: 'online' | 'offline';
    lastActive: Date;
    heartRate: number | null;
    heartRateHistory: any[];
    steps: number | null;
    sleepHours: number | null;
    location: string;
    batteryLevel: number | null;
    isEmergency: boolean;
    mood: string | null;
    activity: string | null;
    temperature: number | null;
}

export interface Family {
    id: string;
    name: string;
    type: string;
    description: string;
    inviteCode: string;
    createdAt: string;
    ownerId: string;
    avatar_url: string | null;
    members: FamilyMember[];
    stats: {
        totalMessages: number;
        totalLocations: number;
        totalMembers: number;
    };
}

interface UserDataContextValue {
    families: Family[];
    selectedFamily: string | null; // Name of the selected family
    setSelectedFamily: (name: string) => void;

    familyStatusMembers: FamilyMember[];
    familyLocations: FamilyLocation[];

    emotionData: EmotionRecord[];
    safetyStats: any;
    locationStats: any;

    loading: boolean;
    refreshing: boolean;

    loadData: () => Promise<void>;
    onRefresh: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [emotionData, setEmotionData] = useState<EmotionRecord[]>([]);
    const [familyLocations, setFamilyLocations] = useState<FamilyLocation[]>([]);

    const [safetyStats, setSafetyStats] = useState<any>(null);
    const [locationStats, setLocationStats] = useState<any>(null);

    // Backend integration functions
    const loadFamilies = async () => {
        try {
            const response: any = await api.get('/families/my-hourse');
            const hourse = response?.hourse;

            if (hourse) {
                const members = (hourse.members || []).map((member: any) => ({
                    id: member.id,
                    name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Member',
                    userName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Member',
                    role: member.role,
                    notifications: typeof member.notifications === 'number' ? member.notifications : 0,
                    lastLocationUpdate: member.joinedAt, // Fallback
                    address: member.address,
                    placeLabel: member.placeLabel,
                    isOnline: !!member.isOnline,
                    avatar: member.avatar || member.avatarUrl || '',

                    // Flatten status mapping here for easier consumption
                    status: member.isOnline ? ('online' as const) : ('offline' as const),
                    lastActive: member.lastActive ? new Date(member.lastActive) : new Date(member.joinedAt || Date.now()),
                    heartRate: member.heartRate ?? 0,
                    heartRateHistory: member.heartRateHistory || [],
                    steps: member.steps ?? 0,
                    sleepHours: member.sleepHours ?? 0,
                    location: member.location || 'Not Available',
                    batteryLevel: member.batteryLevel ?? 0,
                    isEmergency: !!member.isEmergency,
                    mood: member.mood,
                    activity: member.activity,
                    temperature: member.temperature,
                }));

                const familyForState: Family = {
                    id: hourse.id,
                    name: hourse.name,
                    type: hourse.type,
                    description: hourse.description,
                    inviteCode: hourse.invite_code,
                    createdAt: hourse.created_at,
                    ownerId: hourse.owner_id,
                    avatar_url: hourse.avatar || null,
                    members,
                    stats: hourse.stats || {
                        totalMessages: 0,
                        totalLocations: 0,
                        totalMembers: members.length,
                    },
                };

                setFamilies([familyForState]);

                // Default selection if not set
                if (!selectedFamily) {
                    setSelectedFamily(familyForState.name);
                }
            } else {
                setFamilies([]);
            }
        } catch (error: any) {
            if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
                setFamilies([]);
                return;
            }
            console.error('Error loading families:', error);
            setFamilies([]);
        }
    };

    const loadSafetyStats = async () => {
        try {
            const response = await safetyApi.getSafetyStats();
            if (response?.success) {
                setSafetyStats(response.stats);
            }
        } catch (error: any) {
            if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) return;
            console.error('Error loading safety stats:', error);
        }
    };

    const loadLocationStats = async () => {
        try {
            const response = await locationApi.getLocationStats();
            if (response?.success) {
                setLocationStats(response.stats);
            }
        } catch (error: any) {
            if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) return;
            console.error('Error loading location stats:', error);
        }
    };

    const loadEmotionData = async () => {
        try {
            const data = await emotionService.getUserEmotionHistory(365);
            setEmotionData(data);
        } catch (error) {
            console.error('Error loading emotion data:', error);
        }
    };

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            await Promise.all([
                loadFamilies(),
                loadSafetyStats(),
                loadLocationStats(),
                loadEmotionData(),
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // Initial load
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, loadData]);

    // Location service subscriptions
    useEffect(() => {
        if (user) {
            // Set up real-time location tracking
            const unsubscribe = locationService.subscribe((locations) => {
                setFamilyLocations(locations);
            });
            locationService.setCurrentUser(user);

            return () => {
                unsubscribe();
            };
        }
        return undefined;
    }, [user]);

    useEffect(() => {
        if (families && families.length > 0) {
            locationService.setFamilyData(families);
        }
    }, [families]);

    // Derived state: familyStatusMembers (including current user)
    const currentUserMember: FamilyMember = {
        id: user?.id || 'current-user',
        name: user ? `${user.firstName} ${user.lastName}` : 'You',
        userName: user ? `${user.firstName} ${user.lastName}` : 'You', // Adding missing prop
        role: 'owner', // Adding missing prop
        notifications: 0, // Adding missing prop
        lastLocationUpdate: new Date().toISOString(), // Adding missing prop
        isOnline: true,
        avatar: user?.avatar || undefined,
        status: 'online',
        lastActive: new Date(),
        heartRate: null,
        heartRateHistory: [],
        steps: null,
        sleepHours: null,
        location: 'Not Available',
        batteryLevel: null,
        isEmergency: false,
        mood: null,
        activity: 'Not Available',
        temperature: null,
    };

    // Combine members from all families (or selected)
    // For now just taking members from the first loaded family or empty
    const loadedMembers = families.length > 0 ? families[0].members : [];

    // Filter out current user from loaded members if they exist there to avoid dupe, 
    // though usually backend separates them. 
    // Actually HomeScreen implementation just flattens all members.
    const otherMembers = loadedMembers.filter(m => m.id !== user?.id);

    const familyStatusMembers = [currentUserMember, ...otherMembers];

    return (
        <UserDataContext.Provider value={{
            families,
            selectedFamily,
            setSelectedFamily,
            familyStatusMembers,
            familyLocations,
            emotionData,
            safetyStats,
            locationStats,
            loading,
            refreshing,
            loadData,
            onRefresh,
        }}>
            {children}
        </UserDataContext.Provider>
    );
};

export const useUserData = (): UserDataContextValue => {
    const ctx = useContext(UserDataContext);
    if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
    return ctx;
};
