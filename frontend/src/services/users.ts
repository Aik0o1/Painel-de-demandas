import { apiGet } from './api';

export interface User {
    id: string;
    name: string;
    email: string;
    sector_id: string;
}

export const userService = {
    getSectorUsers: async (sectorId: string): Promise<User[]> => {
        return apiGet(`users/sector/${sectorId}`);
    }
};
