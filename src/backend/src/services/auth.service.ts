import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { RegisterDto } from "../dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  generateJwtToken(user: User): string {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload);
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new HttpException(
        "User with this email already exists",
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await AuthService.hashPassword(registerDto.password);
    const user = await this.prisma.user.create({
      data: {
        givenName: registerDto.givenName,
        email: registerDto.email,
        familyName: registerDto.familyName,
        passwordHash: hashedPassword,
      },
    });
    return user;
  }

  async checkUserExists(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    if (!(await AuthService.comparePasswords(password, user.passwordHash))) {
      throw new HttpException("Invalid password", HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    if (!hashedPassword || !password) {
      throw new HttpException("Invalid password", HttpStatus.UNAUTHORIZED);
    }

    return await bcrypt.compare(password, hashedPassword);
  }
}
