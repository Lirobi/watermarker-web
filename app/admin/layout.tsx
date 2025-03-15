"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {

    const session = await getServerSession(authOptions);

    console.log(session);
    if (session && session.user.email === "lilian.bischung@gmail.com") {
        console.log("Updating user role to ADMIN");
        const updatedUser = await prisma.user.update({
            where: { id: session?.user.id },
            data: { role: "ADMIN" },
        });
        console.log("User updated");
        console.log(updatedUser);
        const user = await prisma.user.findUnique({
            where: { id: session?.user.id },
        });
        console.log("User found");
        console.log(user);
    }

    return (
        <div>
            {children}
        </div>
    );
}