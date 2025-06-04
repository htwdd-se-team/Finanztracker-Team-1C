import { Injectable } from '@nestjs/common';

@Injectable()
export class TestService {
  async testIAmAFunction(): Promise<string> {
    return 'LOL 123';
  }
}
