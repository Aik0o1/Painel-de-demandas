import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            sessionId: string;
        } & DefaultSession["user"];
        accessToken?: string;
    }

    interface User extends DefaultUser {
        role: string;
        sessionId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: string;
        sessionId: string;
        error?: string;
    }
}
