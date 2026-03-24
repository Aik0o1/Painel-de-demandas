import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "@/lib/prisma";

export async function validateSession() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return { isValid: false, session: null };
    }

    const sessionId = (session.user as any).sessionId;

    if (!sessionId) {
        return { isValid: false, session: null };
    }

    const activeSession = await prisma.session.findUnique({
        where: {
            sessionId: sessionId,
        }
    });

    if (!activeSession || !activeSession.isActive) {
        return { isValid: false, session: null };
    }

    return { isValid: true, session, activeSession };
}

export async function getSession() {
    return await getServerSession(authOptions);
}
