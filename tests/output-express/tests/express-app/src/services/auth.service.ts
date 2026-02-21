export class AuthService {
    async getAuth(id: string) {
        return { id, name: 'John Doe' };
    }

    async createAuth(data: any) {
        console.log('Creating auth in AuthService:', data);
        return { id: '1', ...data };
    }
}
