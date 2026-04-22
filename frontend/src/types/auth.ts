export interface UserSignup {
    email: string;
    password: string;
    name: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface Token {
    access_token: string;
    token_type: string;
    user_name: string;
}

export interface UserResponse {
    id: number;
    name: string;
    email: string;
}

export interface VoiceSettings {
    voice_type: string;
    pitch: number;
    rate: number;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    voice_settings?: VoiceSettings;
    ai_personality?: string;
    streak_count?: number;
    last_streak_date?: string;
    display_name?: string;
    voice_feedback_enabled?: boolean;
}

export interface ProfileUpdate {
    name?: string;
    email?: string;
    voice_settings?: VoiceSettings;
    ai_personality?: string;
    streak_count?: number;
    last_streak_date?: string;
    display_name?: string;
    voice_feedback_enabled?: boolean;
}
