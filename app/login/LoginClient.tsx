"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/authOps";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import logo from "@/public/mainlogo.png";

export default function LoginClient({ error }: { error: string | null }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (error === "unauthorized") {
            toast.error("Unauthorized", {
                description: "You must be logged in to access the dashboard.",
            });
            router.replace('/login', { scroll: false });
        }
    }, [error, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await login(email, password);

        if (result.error) {
            toast.error("Login Failed", { description: result.error });
            setIsLoading(false);
        } else {
            toast.success("Login Successful", { description: "Redirecting to dashboard..." });
            router.push("/");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted">
            <Card className="mx-auto shadow-none max-w-md w-[90%]">
                <CardHeader className="space-y-4 flex flex-col items-center justify-center pt-10 pb-6">
                    <div className="cursor-pointer" onClick={() => router.push("/login")}>
                        <Image
                            src={logo}
                            alt="The African Parent"
                            width={120}
                            height={40}
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </div>
                    <div className="text-center">
                        <CardTitle className="text-3xl tap-dark font-poppins font-bold tracking-tight">Admin Login</CardTitle>
                        <CardDescription className="tap-dark opacity-70 mt-2">
                            Enter your credentials to access the dashboard
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="tap-dark">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="tap-dark "
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password" className="tap-dark">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="********"
                                className="tap-dark "
                            />
                        </div>
                        <Button type="submit" className="w-full tap-bg-secondary text-white hover:opacity-90" disabled={isLoading}>
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
