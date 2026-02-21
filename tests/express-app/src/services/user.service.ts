export class UserService {
    async getUser(id: string) {
        return { id, name: 'John Doe' };
    }

    async createUser(data: any) {
        console.log('Creating user in UserService:', data);
        return { id: '1', ...data };
    }
}
