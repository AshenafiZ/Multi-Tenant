import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Allows anonymous requests, but attaches req.user when a valid JWT is provided.
 * If token is missing/invalid, request continues unauthenticated.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err) {
      return null;
    }
    return user ?? null;
  }
}


