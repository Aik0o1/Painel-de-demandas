export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password, cpf, position, function: userFunction } = await req.json();

        if (!name || !email || !password || !cpf || !position || !userFunction) {
            return new NextResponse("Dados incompletos", { status: 400 });
        }

        // Check if email already exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return new NextResponse("Email já cadastrado", { status: 409 });
        }

        // Check if CPF already exists
        const cpfExists = await prisma.user.findUnique({ where: { cpf } });
        if (cpfExists) {
            return new NextResponse("CPF já cadastrado", { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Protocol Number (GD-XXXXXX)
        const generateProtocol = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'GD-';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let protocolNumber = generateProtocol();
        // Ensure uniqueness
        while (await prisma.user.findUnique({ where: { protocolNumber } })) {
            protocolNumber = generateProtocol();
        }

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                cpf,
                position,
                function: userFunction,
                protocolNumber,
                status: 'PENDING'
            }
        });

        // Log Audit
        try {
            await prisma.auditLog.create({
                data: {
                    userId: newUser.id,
                    userName: newUser.name,
                    userEmail: newUser.email,
                    action: 'CREATE_ACCOUNT',
                    module: 'AUTH',
                    description: `Usuário registrou-se com protocolo ${protocolNumber}`,
                    ipAddress: req.headers.get("x-forwarded-for") || "Unknown",
                    userAgent: req.headers.get("user-agent") || "Unknown"
                }
            });
        } catch (auditError) {
            console.error("Falha ao criar log de auditoria:", auditError);
        }

        return NextResponse.json({
            message: "Usuário criado com sucesso. Aguarde aprovação.",
            protocol: protocolNumber
        }, { status: 201 });
    } catch (error: any) {
        console.error("Cadastro erro:", error);
        return new NextResponse("Erro interno no servidor", { status: 500 });
    }
}
