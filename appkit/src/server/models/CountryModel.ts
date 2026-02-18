import { prisma } from '../lib/prisma';

export interface Country {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
    isActive: boolean;
}

export class CountryModel {
    // Static methods (no need for pool injection with Prisma)
    static async getAllActive(): Promise<Country[]> {
        const countries = await prisma.country.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return countries.map(c => this.mapRow(c));
    }

    static async getByCode(code: string): Promise<Country | null> {
        const country = await prisma.country.findUnique({
            where: { code }
        });
        return country ? this.mapRow(country) : null;
    }

    static async findAll(): Promise<Country[]> {
        const countries = await prisma.country.findMany({
            orderBy: { name: 'asc' }
        });
        return countries.map(c => this.mapRow(c));
    }

    private static mapRow(row: any): Country {
        return {
            code: row.code,
            name: row.name,
            dialCode: row.dialCode,
            flag: row.flag,
            isActive: row.isActive
        };
    }
}

// Export a default instance for backwards compatibility
// (some code may use new CountryModel(pool))
export default CountryModel;
