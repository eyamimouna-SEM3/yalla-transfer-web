import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 📝 POST /auth/register
   * Inscription utilisateur
   */
  @Post('register')
  async register(
    @Body()
    body: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      role: string;
    },
  ) {
    return this.authService.register(body);
  }

  /**
   * 🔑 POST /auth/login
   * Connexion utilisateur
   */
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.login(body);
  }

  /**
   * 👤 GET /auth/me
   * Récupérer l'utilisateur connecté
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: any) {
    return await this.authService.getUserById(req.user.sub);
  }
}
