import entityService from './EntityService';

class UserHealthService {
    async getMetrics(userId: string, type?: string) {
        const options: any = { ownerId: userId };
        if (type) options.filters = { type }; // Assuming type is stored in JSONB
        
        return entityService.queryEntities('health_metric', options);
    }

    async addMetric(userId: string, data: any) {
        return entityService.createEntity({
            typeName: 'health_metric',
            ownerId: userId,
            attributes: data
        });
    }
}

export default new UserHealthService();
