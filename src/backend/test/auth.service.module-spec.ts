import { HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TestingModule } from "@nestjs/testing";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { RegisterDto } from "../src/dto";
import { AuthService } from "../src/services/auth.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

describe("AuthService", () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await createTestModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    });

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateJwtToken", () => {
    it("should generate a JWT token for a user", () => {
      const mockToken = "mock.jwt.token";
      const signSpy = jest.spyOn(jwtService, "sign").mockReturnValue(mockToken);

      const token = service.generateJwtToken(mockUser);

      expect(signSpy).toHaveBeenCalledWith({ sub: mockUser.id });
      expect(token).toBe(mockToken);
    });
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "newuser@example.com",
      password: "ValidPass123!",
      givenName: "New",
      familyName: "User",
    };

    it("should successfully register a new user", async () => {
      const findUniqueSpy = jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(prismaService.user, "create")
        .mockResolvedValue(mockUser);
      const hashPasswordSpy = jest
        .spyOn(AuthService, "hashPassword")
        .mockResolvedValue("hashedPassword");

      const result = await service.register(registerDto);

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(hashPasswordSpy).toHaveBeenCalledWith(registerDto.password);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          givenName: registerDto.givenName,
          email: registerDto.email,
          familyName: registerDto.familyName,
          passwordHash: "hashedPassword",
        },
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpException if user already exists", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      const createSpy = jest.spyOn(prismaService.user, "create");

      await expect(service.register(registerDto)).rejects.toThrow(
        HttpException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        "User with this email already exists",
      );
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("should register user without familyName if not provided", async () => {
      const registerDtoWithoutFamilyName: RegisterDto = {
        email: "newuser@example.com",
        password: "ValidPass123!",
        givenName: "New",
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);
      const createSpy = jest
        .spyOn(prismaService.user, "create")
        .mockResolvedValue(mockUser);
      jest
        .spyOn(AuthService, "hashPassword")
        .mockResolvedValue("hashedPassword");

      await service.register(registerDtoWithoutFamilyName);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          givenName: registerDtoWithoutFamilyName.givenName,
          email: registerDtoWithoutFamilyName.email,
          familyName: undefined,
          passwordHash: "hashedPassword",
        },
      });
    });
  });

  describe("checkUserExists", () => {
    it("should return user if exists", async () => {
      const findUniqueSpy = jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(mockUser);

      const result = await service.checkUserExists(1);

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null if user does not exist", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      const result = await service.checkUserExists(999);

      expect(result).toBeNull();
    });
  });

  describe("validateUser", () => {
    const email = "test@example.com";
    const password = "ValidPass123!";

    it("should return user if credentials are valid", async () => {
      const findUniqueSpy = jest
        .spyOn(prismaService.user, "findUnique")
        .mockResolvedValue(mockUser);
      const comparePasswordsSpy = jest
        .spyOn(AuthService, "comparePasswords")
        .mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: { email },
      });
      expect(comparePasswordsSpy).toHaveBeenCalledWith(
        password,
        mockUser.passwordHash,
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpException if user not found", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        HttpException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        "User not found",
      );
    });

    it("should throw HttpException if password is invalid", async () => {
      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(mockUser);
      const comparePasswordsSpy = jest
        .spyOn(AuthService, "comparePasswords")
        .mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        HttpException,
      );
      await expect(service.validateUser(email, password)).rejects.toThrow(
        "Invalid password",
      );
      expect(comparePasswordsSpy).toHaveBeenCalled();
    });
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await AuthService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should produce different hashes for the same password (due to salt)", async () => {
      const password = "TestPassword123!";
      // Clear any potential mocks before testing
      jest.restoreAllMocks();
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      // Hashes should be different due to random salt, but both should verify correctly
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBeGreaterThan(0);
      expect(hash2.length).toBeGreaterThan(0);
    });
  });

  describe("comparePasswords", () => {
    it("should return true for matching passwords", async () => {
      const password = "TestPassword123!";
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await AuthService.comparePasswords(
        password,
        hashedPassword,
      );

      expect(result).toBe(true);
    });

    it("should return false for non-matching passwords", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await AuthService.comparePasswords(
        wrongPassword,
        hashedPassword,
      );

      expect(result).toBe(false);
    });

    it("should throw HttpException if password is empty", async () => {
      await expect(
        AuthService.comparePasswords("", "hashedPassword"),
      ).rejects.toThrow(HttpException);
    });

    it("should throw HttpException if hashedPassword is empty", async () => {
      await expect(
        AuthService.comparePasswords("password", ""),
      ).rejects.toThrow(HttpException);
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);
      const hashedPassword = await AuthService.hashPassword(longPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBeGreaterThan(0);

      const result = await AuthService.comparePasswords(
        longPassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it("should handle special characters in passwords", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?";
      const hashedPassword = await AuthService.hashPassword(specialPassword);

      const result = await AuthService.comparePasswords(
        specialPassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it("should handle unicode characters in passwords", async () => {
      const unicodePassword = "Pässwörd123!🚀";
      const hashedPassword = await AuthService.hashPassword(unicodePassword);

      const result = await AuthService.comparePasswords(
        unicodePassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });
  });

  describe("generateJwtToken - Edge Cases", () => {
    it("should generate different tokens for different users", () => {
      const mockToken1 = "token1";
      const mockToken2 = "token2";
      const user1 = { ...mockUser, id: 1 };
      const user2 = { ...mockUser, id: 2 };

      const signSpy = jest
        .spyOn(jwtService, "sign")
        .mockReturnValueOnce(mockToken1)
        .mockReturnValueOnce(mockToken2);

      const token1 = service.generateJwtToken(user1);
      const token2 = service.generateJwtToken(user2);

      expect(token1).toBe(mockToken1);
      expect(token2).toBe(mockToken2);
      expect(signSpy).toHaveBeenCalledWith({ sub: 1 });
      expect(signSpy).toHaveBeenCalledWith({ sub: 2 });
    });
  });
});
