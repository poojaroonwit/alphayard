import entityService from './EntityService';
import { Entity } from '@bondarys/shared';

export class PageService {
  async getAllPages(options: { 
    limit?: number; 
    offset?: number; 
    status?: string; 
    search?: string; 
  } = {}) {
    const filters: any = {};
    if (options.status) filters.status = options.status;
    if (options.search) filters.search = options.search;

    return entityService.queryEntities('page', {
      ...filters,
      limit: options.limit,
      offset: (options as any).offset
    } as any);
  }

  async getPageById(id: string): Promise<Entity | null> {
    return entityService.getEntity(id);
  }

  async createPage(data: any, ownerId: string): Promise<Entity> {
    const { title, slug, content, status = 'draft', ...other } = data;
    
    return entityService.createEntity({
      typeName: 'page',
      ownerId,
      attributes: {
        title,
        slug,
        content,
        status,
        ...other
      }
    });
  }

  async updatePage(id: string, data: any, ownerId: string): Promise<Entity | null> {
    return entityService.updateEntity(id, { attributes: data });
  }

  async deletePage(id: string): Promise<boolean> {
    return entityService.deleteEntity(id);
  }

  async updatePageComponents(id: string, components: any[]): Promise<Entity | null> {
    return entityService.updateEntity(id, { 
      attributes: { components } 
    });
  }

  async publishPage(id: string, userId: string): Promise<Entity | null> {
    return entityService.updateEntity(id, { 
      attributes: { 
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: userId
      } 
    });
  }
}

export const pageService = new PageService();
export default pageService;
