import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private normalizeRole(role?: string) {
    switch (role) {
      case 'user':
        return 'client_b2c';
      case 'provider':
        return 'supplier';
      case 'admin':
        return 'admin';
      case 'client_b2c':
      case 'client_b2b':
      case 'driver_independent':
      case 'driver_employee':
      case 'supplier':
        return role;
      default:
        return 'client_b2c';
    }
  }

  /**
   * 📝 Register - Créer un nouvel utilisateur
   */
  async register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) {
    // Vérifier que l'utilisateur n'existe pas
    const existingUser = await this.prisma.users.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email ou téléphone déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Créer l'utilisateur
    const user = await this.prisma.users.create({
      data: {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        password_hash: hashedPassword,
        role: this.normalizeRole(data.role),
      },
    });

    // Générer le JWT
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * 🔑 Login - Connexion utilisateur
   */
  async login(data: { email: string; password: string }) {
    // Trouver l'utilisateur
    const user = await this.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    if (!user.password_hash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le JWT
    const token = this.generateToken(user);

    return {
      access_token: token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * 🎫 Générer un JWT token
   */
  generateToken(user: any) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * 🔍 Récupérer un utilisateur par ID
   */
  async getUserById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        avatar_url: true,
      },
    });
  }
}
