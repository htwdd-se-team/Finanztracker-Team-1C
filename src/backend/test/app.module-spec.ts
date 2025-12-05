import { Test, TestingModule } from "@nestjs/testing";

import { AppController } from "../src/app.controller";
import { AppModule } from "../src/app.module";
import { AppService } from "../src/app.service";

describe("AppModule", () => {
  let module: TestingModule;
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  afterEach(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should have AppController", () => {
    expect(appController).toBeDefined();
  });

  it("should have AppService", () => {
    expect(appService).toBeDefined();
  });

  describe("AppController", () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe("Hello World!");
    });
  });
});
