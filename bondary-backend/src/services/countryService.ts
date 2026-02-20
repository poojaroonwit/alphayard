
import { prisma } from '../lib/prisma';

export interface Country {
    id: number;
    code: string;
    name: string;
    flag: string;
    phone_code: string;
    is_supported: boolean;
}

export class CountryService {
    async getAllCountries(): Promise<Country[]> {
        try {
            const countries = await prisma.country.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' }
            });
            return countries.map(c => this.mapToServiceFormat(c));
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    }

    async searchCountries(term: string): Promise<Country[]> {
        try {
            const countries = await prisma.country.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: term, mode: 'insensitive' } },
                        { code: { contains: term, mode: 'insensitive' } }
                    ]
                },
                orderBy: { name: 'asc' }
            });
            return countries.map(c => this.mapToServiceFormat(c));
        } catch (error) {
            console.error('Error searching countries:', error);
            throw error;
        }
    }

    private mapToServiceFormat(country: {
        id: string;
        code: string;
        name: string;
        flagEmoji: string | null;
        phoneCode: string | null;
        isActive: boolean;
    }): Country {
        return {
            id: parseInt(country.id.replace(/-/g, '').substring(0, 8), 16) || 0, // Convert UUID to number (approximation)
            code: country.code,
            name: country.name,
            flag: country.flagEmoji || '',
            phone_code: country.phoneCode || '',
            is_supported: country.isActive
        };
    }
}

export const countryService = new CountryService();
