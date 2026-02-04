import entityService from './EntityService';

class ShoppingService {
    async list(ownerId: string, circleId?: string) {
        return entityService.queryEntities('shopping_item', {
            ownerId,
            applicationId: circleId
        } as any);
    }

    async create(data: any) {
        const { userId, user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'shopping_item',
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

export default new ShoppingService();
