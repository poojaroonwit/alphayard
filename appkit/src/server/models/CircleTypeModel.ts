import { prisma } from '../lib/prisma';

export interface CircleType {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  icon?: string;
  color?: string;
  defaultSettings: any;
  isSystem: boolean;
  createdAt: Date;
}

export class CircleTypeModel {
  static async findAll(): Promise<CircleType[]> {
    const circleTypes = await prisma.circleType.findMany({
      orderBy: { name: 'asc' }
    });
    return circleTypes.map(ct => this.mapRow(ct));
  }

  static async findById(id: string): Promise<CircleType | null> {
    const circleType = await prisma.circleType.findUnique({
      where: { id }
    });
    return circleType ? this.mapRow(circleType) : null;
  }

  static async findByName(name: string): Promise<CircleType | null> {
    const circleType = await prisma.circleType.findFirst({
      where: { name }
    });
    return circleType ? this.mapRow(circleType) : null;
  }

  static async create(data: Partial<CircleType>): Promise<CircleType> {
    const circleType = await prisma.circleType.create({
      data: {
        name: data.name!,
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        defaultSettings: data.defaultSettings || {},
        isSystem: data.isSystem || false
      }
    });
    return this.mapRow(circleType);
  }

  static async update(id: string, data: Partial<CircleType>): Promise<CircleType | null> {
    const circleType = await prisma.circleType.update({
      where: { id },
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        defaultSettings: data.defaultSettings,
        isSystem: data.isSystem
      }
    });
    return this.mapRow(circleType);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.circleType.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  private static mapRow(row: any): CircleType {
    return {
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      description: row.description,
      icon: row.icon,
      color: row.color,
      defaultSettings: row.defaultSettings,
      isSystem: row.isSystem,
      createdAt: row.createdAt
    };
  }
}
