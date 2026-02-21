import { AuthService } from '../services/auth.service';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    async handleGet(id: string) {
        console.log('AuthController handling GET for auth:', id);
        return await this.authService.getAuth(id);
    }

    async handlePost(data: any) {
        console.log('AuthController handling POST');
        return await this.authService.createAuth(data);
    }
}
