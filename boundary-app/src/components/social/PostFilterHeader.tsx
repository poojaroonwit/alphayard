import React from 'react';

/**
 * Shared types for Social filtering and sorting.
 */
export type SortOrder = 'recent' | 'nearby' | 'popular';
export type GeoScope = 'worldwide' | 'country' | 'nearby' | 'custom' | 'following';
export type DistanceUnit = 'km' | 'mile';

export interface CustomCoordinates {
  latitude: number;
  longitude: number;
  name?: string;
}

// Note: PostFilterHeader component code was removed as it was broken and unused.
// All location filtering is now handled by LocationFilterDrawer.
