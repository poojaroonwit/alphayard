import entityService from './EntityService';

class SearchService {
    async search(userId: string, query: string, types: string[] = []) {
        // Broad search across all entities the user has access to
        const filters: any = {};
        if (query) {
            filters['data->>name'] = { LIKE: `%${query}%` }; // Basic search by name
            // Add more searchable fields if needed
        }

        const result = await entityService.queryEntities(types.length > 0 ? types : undefined as any, {
            ownerId: userId,
            ...filters
        });

        return result.entities;
    }
}

export const searchService = new SearchService();
export default searchService;
