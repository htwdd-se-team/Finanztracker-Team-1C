import { HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TestingModule } from "@nestjs/testing";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { RegisterDto } from "../src/dto";
import { AuthService } from "../src/services/auth.service";
import { PrismaService } from "../src/services/prisma.service";

import { createTestModule } from "./test-helpers";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let module: TestingModule;
  let mockUserFindUnique: jest.Mock;
  let mockUserCreate: jest.Mock;
  let mockJwtSign: jest.Mock;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    passwordHash: "hashedPassword",
    givenName: "Test",
    familyName: "User",
    emergencyReserve: 100000,
    createdAt: new Date("2024-01-01"),
  };

  beforeAll(async () => {
    mockUserFindUnique = jest.fn();
    mockUserCreate = jest.fn();
    mockJwtSign = jest.fn();

    const { createMock } = await import("@golevelup/ts-jest");
    const mockPrismaService = createMock<PrismaService>({
      user: {
        findUnique: mockUserFindUnique,
        create: mockUserCreate,
      },
    } as unknown as PrismaService);

    const mockJwtService = createMock<JwtService>({
      sign: mockJwtSign,
    } as unknown as JwtService);

    module = await createTestModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    });

    service = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("generateJwtToken", () => {
    it("should generate a JWT token for a user", () => {
      mockJwtSign.mockReturnValue("mock-jwt-token");

      const result = service.generateJwtToken(mockUser);

      expect(result).toBe("mock-jwt-token");
      expect(mockJwtSign).toHaveBeenCalledWith({ sub: mockUser.id });
    });

    it("should generate different tokens for different users", () => {
      mockJwtSign.mockImplementation(
        (payload: { sub: number }) => `token-${payload.sub}`,
      );

      const user1 = { ...mockUser, id: 1 };
      const user2 = { ...mockUser, id: 2 };

      const token1 = service.generateJwtToken(user1);
      const token2 = service.generateJwtToken(user2);

      expect(token1).toBe("token-1");
      expect(token2).toBe("token-2");
      expect(token1).not.toBe(token2);
    });
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const registerDto: RegisterDto = {
        email: "new@example.com",
        password: "password123",
        givenName: "New",
        familyName: "User",
      };

      mockUserFindUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      mockUserCreate.mockResolvedValue({
        ...mockUser,
        ...registerDto,
        passwordHash: "hashedPassword",
      });

      const result = await service.register(registerDto);

      expect(result.email).toBe(registerDto.email);
      expect(result.givenName).toBe(registerDto.givenName);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          givenName: registerDto.givenName,
          email: registerDto.email,
          familyName: registerDto.familyName,
          passwordHash: "hashedPassword",
        },
      });
    });

    it("should throw HttpException if user already exists", async () => {
      const registerDto: RegisterDto = {
        email: "existing@example.com",
        password: "password123",
        givenName: "Existing",
      };

      mockUserFindUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        HttpException,
      );
      expect(mockUserCreate).not.toHaveBeenCalled();
    });

    it("should register user without familyName if not provided", async () => {
      const registerDto: RegisterDto = {
        email: "new@example.com",
        password: "password123",
        givenName: "New",
      };

      mockUserFindUnique.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      mockUserCreate.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        givenName: registerDto.givenName,
        familyName: null,
        passwordHash: "hashedPassword",
      });

      const result = await service.register(registerDto);

      expect(result.familyName).toBeNull();
      expect(mockUserCreate).toHaveBeenCalledWith({
        data: {
          givenName: registerDto.givenName,
          email: registerDto.email,
          familyName: undefined,
          passwordHash: "hashedPassword",
        },
      });
    });
  });

  describe("checkUserExists", () => {
    it("should return user if exists", async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);

      const result = await service.checkUserExists(1);

      expect(result).toEqual(mockUser);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null if user does not exist", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await service.checkUserExists(999);

      expect(result).toBeNull();
    });
  });

  describe("validateUser", () => {
    it("should return user if credentials are valid", async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );

      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        mockUser.passwordHash,
      );
    });

    it("should throw HttpException if user not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(
        service.validateUser("notfound@example.com", "password123"),
      ).rejects.toThrow(HttpException);
    });

    it("should throw HttpException if password is invalid", async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser("test@example.com", "wrongpassword"),
      ).rejects.toThrow(HttpException);
    });
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      const result = await AuthService.hashPassword("password123");

      expect(result).toBe("hashedPassword");
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
    });

    it("should produce different hashes for the same password (due to salt)", async () => {
      (bcrypt.genSalt as jest.Mock)
        .mockResolvedValueOnce("salt1")
        .mockResolvedValueOnce("salt2");
      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce("hash1")
        .mockResolvedValueOnce("hash2");

      const hash1 = await AuthService.hashPassword("password123");
      const hash2 = await AuthService.hashPassword("password123");

      expect(hash1).toBe("hash1");
      expect(hash2).toBe("hash2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("comparePasswords", () => {
    it("should return true for matching passwords", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.comparePasswords(
        "password123",
        "hashedPassword",
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword",
      );
    });

    it("should return false for non-matching passwords", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.comparePasswords(
        "wrongpassword",
        "hashedPassword",
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
        AuthService.comparePasswords("password123", ""),
      ).rejects.toThrow(HttpException);
    });

    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.comparePasswords(
        longPassword,
        "hashedPassword",
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        longPassword,
        "hashedPassword",
      );
    });

    it("should handle special characters in passwords", async () => {
      const specialPassword = "p@ssw0rd!#$%^&*()";
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.comparePasswords(
        specialPassword,
        "hashedPassword",
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        specialPassword,
        "hashedPassword",
      );
    });

    it("should handle unicode characters in passwords", async () => {
      const unicodePassword = "pässwörd测试🔐";
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.comparePasswords(
        unicodePassword,
        "hashedPassword",
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        unicodePassword,
        "hashedPassword",
      );
    });
  });
});
