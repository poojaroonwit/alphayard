export interface SystemConfig {
  id?: string;
  key: string;
  value: any;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SystemConfigModel {
  static async findByKey(key: string): Promise<SystemConfig | null> {
    // Mock implementation - in real app, query from database
    return null;
  }

  static async create(config: Partial<SystemConfig>): Promise<SystemConfig> {
    // Mock implementation - in real app, create in database
    return {
      id: '1',
      key: config.key || '',
      value: config.value,
      description: config.description,
      isActive: config.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async update(key: string, value: any): Promise<SystemConfig> {
    // Mock implementation - in real app, update in database
    return {
      id: '1',
      key,
      value,
      description: 'Updated config',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async delete(key: string): Promise<boolean> {
    // Mock implementation - in real app, delete from database
    return true;
  }

  static async findAll(): Promise<SystemConfig[]> {
    // Mock implementation - in real app, query from database
    return [];
  }
}
