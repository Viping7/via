import { UserService } from '../services/user.service';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async handleGet(id: string) {
        console.log('UserController handling GET for user:', id);
        return await this.userService.getUser(id);
    }

    async handlePost(data: any) {
        console.log('UserController handling POST');
        return await this.userService.createUser(data);
    }
}
