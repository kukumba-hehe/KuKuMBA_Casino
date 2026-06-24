import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService, RequestMeta } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto';

/** Minimal shape we read off the request — avoids depending on @types/express. */
type ReqLike = {
  headers: Record<string, string | undefined>;
  socket?: { remoteAddress?: string };
};

function meta(req: ReqLike): RequestMeta {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: ReqLike) {
    return this.auth.register(dto, meta(req));
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: ReqLike) {
    return this.auth.login(dto, meta(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: ReqLike) {
    return this.auth.refresh(dto.refreshToken, meta(req));
  }

  @Public()
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.auth.publicUser(user);
  }
}
