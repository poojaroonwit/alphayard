'use client';

import React, { useEffect, useState } from 'react';
import { Region, localizationService } from '../../../../services/localizationService';
import { Card } from '../../../../components/ui/Card';
import { Switch } from '@headlessui/react';
import { GlobeAltIcon, MapIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { toast } from '@/hooks/use-toast';

export default function RegionsPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRegions();
    }, []);

    const loadRegions = async () => {
        try {
            const data = await localizationService.getRegions();
            setRegions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, checked: boolean) => {
        // Optimistic update
        setRegions(prev => prev.map(r => r.id === id ? { ...r, isEnabled: checked } : r));
        try {
            await localizationService.toggleRegion(id, checked);
            toast({ title: checked ? "Region Enabled" : "Region Disabled" });
        } catch (e) {
            loadRegions(); // Revert
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"/></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MapIcon className="w-8 h-8 text-blue-600" />
                    Regions
                </h1>
                <p className="text-gray-500">Manage supported geographic regions and local settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regions.map((region) => (
                    <Card key={region.id} className="relative overflow-hidden border border-gray-200 hover:border-blue-300 transition-all">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <GlobeAltIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{region.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium font-mono">{region.code}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={region.isEnabled}
                                    onChange={(checked: boolean) => handleToggle(region.id, checked)}
                                    className={`${
                                        region.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                >
                                    <span
                                        className={`${
                                            region.isEnabled ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </Switch>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 text-sm text-gray-600">
                                <BanknotesIcon className="w-4 h-4 text-gray-400" />
                                <span>Currency: <span className="font-semibold text-gray-900">{region.currency}</span></span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
