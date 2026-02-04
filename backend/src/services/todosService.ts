import entityService from './EntityService';

class TodosService {
    async list(ownerId: string, circleId?: string) {
        return entityService.queryEntities('todo', {
            ownerId,
            applicationId: circleId
        } as any);
    }

    async create(data: any) {
        const { userId, user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'todo',
            ownerId: userId || user_id,
            attributes
        });
    }

    async update(id: string, attributes: any) {
        return entityService.updateEntity(id, { attributes });
    }

    async delete(id: string) {
        return entityService.deleteEntity(id);
    }

    async reorder(orderedIds: string[]) {
        // Implementation for reordering if needed, or simply update 'position' attribute
        for (let i = 0; i < orderedIds.length; i++) {
            await entityService.updateEntity(orderedIds[i], {
                attributes: { position: i }
            });
        }
        return { success: true };
    }
}

export default new TodosService();
