import entityService from './EntityService';

class NotesService {
    async list(ownerId: string, circleId?: string) {
        return entityService.queryEntities('note', {
            ownerId,
            applicationId: circleId // Using applicationId as a proxy for circleId if needed, or filter by relation
        } as any);
    }

    async create(data: any) {
        const { userId, user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'note',
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
}

export default new NotesService();
