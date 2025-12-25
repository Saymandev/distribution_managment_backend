import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
    console.log('🔒 JwtAuthGuard - Guard instance created');
  }

  canActivate(context: ExecutionContext) {
    console.log('🔒 JwtAuthGuard - canActivate called');
    const request = context.switchToHttp().getRequest();
    console.log('🔒 JwtAuthGuard - Request URL:', request.url);
    console.log('🔒 JwtAuthGuard - Request method:', request.method);
    
    // Check headers - Express lowercases headers
    const authHeader = request.headers.authorization || request.headers.Authorization;
    console.log('🔒 JwtAuthGuard - Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING');
    console.log('🔒 JwtAuthGuard - All header keys:', Object.keys(request.headers));
    
    if (!authHeader) {
      console.error('❌ JwtAuthGuard - NO AUTHORIZATION HEADER FOUND!');
      console.error('   Request headers:', JSON.stringify(request.headers, null, 2));
    }
    
    const result = super.canActivate(context);
    console.log('🔒 JwtAuthGuard - canActivate result:', result);
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error('JwtAuthGuard - Authentication failed:', err?.message || info?.message || 'Unknown error');
      throw err || new Error('Unauthorized');
    }
    console.log('JwtAuthGuard - Authentication successful for:', user.email);
    return user;
  }
}

