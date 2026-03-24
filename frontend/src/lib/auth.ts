import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from 'crypto';
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                const user = await prisma.user.findUnique({ where: { email: credentials.email } });

                // Collect request info (IP, User Agent)
                const userAgent = req?.headers?.["user-agent"] || "Unknown";
                const ip = req?.headers?.["x-forwarded-for"] || "Unknown";

                if (!user) {
                    throw new Error("No user found with this email");
                }

                // Check Status strictly
                if (user.status === 'PENDING') {
                    throw new Error("Sua conta está em análise. Aguarde aprovação.");
                }
                if (user.status === 'REJECTED') {
                    throw new Error("Sua conta foi rejeitada pelo administrador.");
                }
                if (user.status === 'BLOCKED') {
                    throw new Error("Sua conta está bloqueada.");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isValid) {
                    await prisma.auditLog.create({
                        data: {
                            userId: user.id,
                            userName: user.name,
                            userEmail: user.email,
                            action: 'LOGIN_FAILED',
                            module: 'AUTH',
                            description: 'Tentativa de login com senha incorreta',
                            ipAddress: ip,
                            userAgent: userAgent,
                        }
                    });
                    throw new Error("Invalid password");
                }

                // Create new session
                const sessionId = randomUUID();

                await prisma.session.create({
                    data: {
                        userId: user.id,
                        sessionId: sessionId,
                        ipAddress: ip,
                        userAgent: userAgent,
                        isActive: true
                    }
                });

                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        userName: user.name,
                        userEmail: user.email,
                        action: 'LOGIN_SUCCESS',
                        module: 'AUTH',
                        description: 'Login realizado com sucesso',
                        ipAddress: ip,
                        userAgent: userAgent,
                    }
                });

                await prisma.loginAudit.create({
                    data: {
                        userId: user.id,
                        email: user.email,
                        ipAddress: ip,
                        userAgent: userAgent,
                        status: 'SUCCESS'
                    }
                });

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                    sessionId: sessionId
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.sessionId = (user as any).sessionId;
            }
            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.email = session.user.email;
                token.image = session.user.image;
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                (session as any).user.sessionId = token.sessionId;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
};
