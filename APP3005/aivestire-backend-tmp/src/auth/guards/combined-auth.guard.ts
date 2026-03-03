import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'admin-jwt']) {
  canActivate(context: ExecutionContext) {
    // Add logging or custom logic here if needed
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Authentication failed. Please provide a valid token or admin session.',
        )
      );
    }
    return user;
  }
}
