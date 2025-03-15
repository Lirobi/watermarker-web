"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Switch } from "@heroui/switch";
import { motion } from "framer-motion";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    storageUsed: number;
    analytics?: {
        ipAddress: string | null;
        device: string | null;
        country: string | null;
        city: string | null;
        lastVisit: string;
        visitCount: number;
    };
    payment?: {
        status: string;
    };
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    console.log(session);
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState("users");
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
            router.push("/dashboard");
        }
    }, [status, session, router]);

    // Fetch users and settings
    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const users = await fetch("/api/admin/users");
                    const usersData = await users.json();
                    setUsers(usersData);
                    setMaintenanceMode(false); // Mock setting
                } catch (error) {
                    console.error("Error fetching admin data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [status, session]);

    const handleMaintenanceModeToggle = async () => {
        setIsSaving(true);
        // In a real implementation, this would be an API call
        setTimeout(() => {
            setMaintenanceMode(!maintenanceMode);
            setIsSaving(false);
        }, 1000);
    };

    const handleTogglePaymentStatus = async (userId: string, status: string) => {
        const response = await fetch(`/api/user/payment-status`, {
            method: "POST",
            body: JSON.stringify({ userId, status }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log("User paid status updated");
            setUsers(users.map((user) => user.id === userId ? data.user : user));
        } else {
            console.error("User paid status not updated");
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    if (status === "loading" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Maintenance Mode:</span>
                            <Switch
                                isSelected={maintenanceMode}
                                onValueChange={handleMaintenanceModeToggle}
                                size="sm"
                                isDisabled={isSaving}
                            />
                        </div>
                        {isSaving && <Spinner size="sm" color="primary" />}
                    </div>
                </div>

                <Card className="border border-blue-100">
                    <CardHeader>
                        <Tabs
                            aria-label="Admin Sections"
                            selectedKey={selectedTab}
                            onSelectionChange={(key) => setSelectedTab(key as string)}
                            className="w-full"
                        >
                            <Tab key="users" title="Users" />
                            <Tab key="analytics" title="Analytics" />
                            <Tab key="settings" title="Settings" />
                        </Tabs>
                    </CardHeader>
                    <CardBody>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner size="lg" color="primary" />
                            </div>
                        ) : selectedTab === "users" ? (
                            <Table aria-label="Users table">
                                <TableHeader>
                                    <TableColumn>USER</TableColumn>
                                    <TableColumn>ROLE</TableColumn>
                                    <TableColumn>STORAGE USED</TableColumn>
                                    <TableColumn>PAYMENT STATUS</TableColumn>
                                    <TableColumn>JOINED</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={user.name || "User"}
                                                        src={user.image || undefined}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{user.name || "Unnamed User"}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color={user.role === "ADMIN" ? "danger" : "primary"}>
                                                    {user.role}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>{formatBytes(user.storageUsed)}</TableCell>
                                            <TableCell>{formatDate(user.createdAt)}</TableCell>
                                            <TableCell>
                                                <Chip size="sm" variant="flat" color={user.payment?.status === "PAID" ? "success" : "danger"}>
                                                    {user.payment?.status || "UNPAID"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="flat" color={user.payment?.status === "PAID" ? "danger" : "primary"} onClick={() => handleTogglePaymentStatus(user.id, user.payment?.status === "PAID" ? "UNPAID" : "PAID")}>{user.payment?.status === "PAID" ? "Remove Paid Status" : "Give Paid Status"}</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : selectedTab === "analytics" ? (
                            <Table aria-label="User analytics table">
                                <TableHeader>
                                    <TableColumn>USER</TableColumn>
                                    <TableColumn>IP ADDRESS</TableColumn>
                                    <TableColumn>LOCATION</TableColumn>
                                    <TableColumn>DEVICE</TableColumn>
                                    <TableColumn>LAST VISIT</TableColumn>
                                    <TableColumn>VISITS</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={user.name || "User"}
                                                        src={user.image || undefined}
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{user.name || "Unnamed User"}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.analytics?.ipAddress || "Unknown"}</TableCell>
                                            <TableCell>
                                                {user.analytics?.country && user.analytics?.city
                                                    ? `${user.analytics.city}, ${user.analytics.country}`
                                                    : "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs truncate max-w-[200px]">
                                                    {user.analytics?.device || "Unknown"}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {user.analytics?.lastVisit
                                                    ? formatDate(user.analytics.lastVisit)
                                                    : "Never"}
                                            </TableCell>
                                            <TableCell>{user.analytics?.visitCount || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Site Settings</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">Maintenance Mode</p>
                                                <p className="text-sm text-gray-500">
                                                    When enabled, only admins can access the site. All other users will see a maintenance page.
                                                </p>
                                            </div>
                                            <Switch
                                                isSelected={maintenanceMode}
                                                onValueChange={handleMaintenanceModeToggle}
                                                isDisabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Storage Settings</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 border rounded-lg">
                                            <p className="font-medium">Default Storage Limit</p>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Set the default storage limit for new users.
                                            </p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    defaultValue={10}
                                                    min={1}
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                                <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                                    <option value="MB">MB</option>
                                                    <option value="GB">GB</option>
                                                </select>
                                                <Button color="primary">Save</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </motion.div>
        </div >
    );
}