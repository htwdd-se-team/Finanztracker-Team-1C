import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

import { UserResponseDto } from "../dto";

import { PrismaService } from "./prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(user: User): Promise<UserResponseDto> {
    return await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        givenName: true,
        familyName: true,
        email: true,
        createdAt: true,
      },
    });
  }
}
