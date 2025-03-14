import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/watermarks - Get all watermarks for the current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const watermarks = await prisma.watermark.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(watermarks);
    } catch (error) {
        console.error("Error fetching watermarks:", error);
        return NextResponse.json(
            { error: "Failed to fetch watermarks" },
            { status: 500 }
        );
    }
}

// POST /api/watermarks - Create a new watermark
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.type || !data.content) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create watermark
        const watermark = await prisma.watermark.create({
            data: {
                name: data.name,
                type: data.type,
                content: data.content,
                position: data.position || null,
                opacity: data.opacity || 1.0,
                scale: data.scale || 1.0,
                rotation: data.rotation || 0,
                userId: session.user.id,
            },
        });

        return NextResponse.json(watermark, { status: 201 });
    } catch (error) {
        console.error("Error creating watermark:", error);
        return NextResponse.json(
            { error: "Failed to create watermark" },
            { status: 500 }
        );
    }
} 