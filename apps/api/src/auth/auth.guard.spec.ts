import { describe, it, expect } from '@jest/globals';
import { AuthGuard } from './auth.guard.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  it('should be defined', () => {
    expect(new AuthGuard({} as JwtService)).toBeDefined();
  });
});
