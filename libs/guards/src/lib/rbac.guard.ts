import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@e-invoice/constants';
import { ROLES_KEY } from '@e-invoice/decorators';
import { verifyJwtToken } from '@e-invoice/utils';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Thiếu JWT Token xác thực (Authorization: Bearer <token>)',
      );
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyJwtToken(token);

    if (!payload) {
      throw new UnauthorizedException('JWT Token không hợp lệ hoặc đã hết hạn');
    }

    request.user = payload;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException(
        `Truy cập bị từ chối (403): Quyền hiện tại (${user?.role || 'GUEST'}) không được phép thực hiện thao tác này. Yêu cầu quyền: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
