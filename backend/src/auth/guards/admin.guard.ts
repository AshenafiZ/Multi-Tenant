import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

@Injectable()
export class AdminGuard extends RolesGuard {
  constructor() {
    super(null!); 
  }

  canActivate(context: ExecutionContext): boolean {
    const canActivate = super.canActivate(context);
    if (!canActivate) {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}
