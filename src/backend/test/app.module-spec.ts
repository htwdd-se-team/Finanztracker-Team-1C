import { TestingModule } from "@nestjs/testing";

import { AppController } from "../src/app.controller";
import { AppModule } from "../src/app.module";
import { AppService } from "../src/app.service";

import { createTestModule } from "./test-helpers";

describe("AppModule", () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await createTestModule({
      imports: [AppModule],
    });
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should have AppController", () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
  });

  it("should have AppService", () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
  });

  describe("AppController", () => {
    let controller: AppController;

    beforeEach(() => {
      controller = module.get<AppController>(AppController);
    });

    it('should return "Hello World!"', () => {
      const result = controller.getHello();
      expect(result).toBe("Hello World!");
    });
  });
});
