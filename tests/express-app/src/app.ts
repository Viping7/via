import { UserController } from './controllers/user.controller';

const userController = new UserController();

console.log('Express app started');

userController.handleGet('123').then(user => {
    console.log('User fetched:', user);
});
