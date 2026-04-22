import { api } from "@/lib/api";
import { UserResponse, Token, UserLogin, UserSignup, ProfileUpdate, VoiceSettings, UserProfile } from "@/types/auth"; // We might need to define these types if they don't exist, but I'll define interfaces locally for now to be safe.

// Local interfaces removed in favor of '@/types/auth'

export const authService = {
    async signup(data: UserSignup): Promise<Token> {
        return api.post("/auth/signup", data);
    },

    async login(data: UserLogin): Promise<Token> {
        return api.post("/auth/signin", data);
    },

    async logout(): Promise<void> {
        return api.post("/auth/logout", {});
    },

    async getProfile(): Promise<UserProfile> {
        return api.get("/settings/profile");
    },

    async updateProfile(data: Partial<UserProfile>): Promise<any> {
        return api.put("/settings/profile", data);
    }
};
