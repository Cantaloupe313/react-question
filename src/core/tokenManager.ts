// src/core/tokenManager.ts
import axios from "axios";
import { refreshToken } from "../api/interface/auth";

const TOKEN_KEY = "authToken";

class TokenManager {
  private static instance: TokenManager;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  public async refreshToken(): Promise<string | null> {
    try {
      const response: any = await refreshToken({ refreshToken: "" });
      if (response.success) {
        this.setToken(response.data.token);
        return response.data.token;
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
    }
    return null;
  }
}

export default TokenManager.getInstance();
