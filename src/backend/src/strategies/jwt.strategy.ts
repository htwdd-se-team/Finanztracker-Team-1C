import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { BackendConfig } from "../backend.config";
import { AuthService } from "../services";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    @Inject(BackendConfig) private readonly backendConfig: BackendConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter("token"),
        ExtractJwt.fromUrlQueryParameter("token"),
      ]),
      ignoreExpiration: false,
      secretOrKey: backendConfig.JWT_SECRET,
    });
  }

  async validate(payload: { sub: number }) {
    const user = await this.authService.checkUserExists(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
