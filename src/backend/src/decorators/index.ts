import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { Request } from "express";

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request: Request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    return request.user as User;
  },
);
