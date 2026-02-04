class GeofenceService {
    async checkGeofence(userId: string, location: any) {
        // Placeholder for geofencing logic
        return { inZone: true };
    }
}

export const geofenceService = new GeofenceService();
export default geofenceService;
