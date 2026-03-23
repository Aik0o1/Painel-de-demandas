export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "No session found" }, { status: 401 });
    }

    const sessionId = (session.user as any).sessionId;
    const userId = session.user.id;

    if (sessionId) {
        try {
            // Deactivate session
            await prisma.session.update({
                where: { sessionId: sessionId },
                data: { isActive: false }
            });

            // Audit Log
            await prisma.loginAudit.create({
                data: {
                    userId: userId,
                    email: session.user.email as string,
                    ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
                    userAgent: req.headers.get("user-agent") || "Unknown",
                    status: 'LOGOUT',
                    loginAt: new Date()
                }
            });
        } catch (e) {
            console.error("Logout Error:", e);
        }
    }

    return NextResponse.json({ message: "Logged out successfully" });
}
