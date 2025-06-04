import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  testIAmAFunction(): string {
    return 'LOL 123';
  }
}
