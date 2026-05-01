"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../AuthContext"; // Adjusted path
import {
  updateAdminName,
  updateAdminPasswordByAdmin,
} from "@/app/actions/adminOps"; // Using secure actions
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle,
  FilePenLine,
  KeyRound,
  Save,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Admins } from "@/app/generated/prisma/client";
import { FaUserCircle } from "react-icons/fa";

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const nameParts = session?.name?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts[1] || "";
  const [name, setName] = useState("");
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setName(session.name);
    }
  }, [session]);

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || name === session.name) return;
    setIsDetailsLoading(true);
    const success = await updateAdminName(
      session.email,
      name,
      session as Admins
    );
    setIsDetailsLoading(false);

    if (success) {
      toast.success("Profile Updated", {
        description:
          "Your name has been changed. Please log in again to see the changes.",
      });
      logout();
    } else {
      toast.error("Update Failed", {
        description: "Could not update your profile details.",
      });
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setIsPasswordLoading(true);
    const result = await updateAdminPasswordByAdmin(
      session.email,
      passwordData.oldPassword,
      passwordData.newPassword
    );
    setIsPasswordLoading(false);

    if (result.success) {
      toast.success("Password Updated", {
        description:
          "You have been logged out for security. Please log in with your new password.",
        duration: 5000,
        onDismiss: () => logout(),
      });
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error("Update Failed", { description: result.message });
    }
  };

  if (!session) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container tap-dark mx-auto max-w-6xl py-8 px-6">
      <div className="flex items-center gap-4 mb-8">
        {session ? (
          <img
            src={`https://avatar.iran.liara.run/username?username=${nameParts[0]}+${nameParts[1]}`}
            alt="Profile Picture"
            width={200}
            height={200}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <FaUserCircle className="w-8 h-10 " />
        )}
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account details.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="border-black/30 tap-dark">
            <CardHeader>
              <CardTitle className="text-xl">{session.name}</CardTitle>
              <CardDescription>
                Your current role and contact info.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <p className="text-muted-foreground text-sm break-all">
                    {session.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Role</p>
                  <Badge variant="default">{session.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="border-black/30 tap-dark">
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilePenLine className="h-5 w-5" /> Profile Details
                </CardTitle>
                <CardDescription>Update your public name.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-black/30 tap-dark"
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-1 px-6">
                <Button
                  type="submit"
                  disabled={isDetailsLoading || name === session.name}
                >
                  {isDetailsLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="border-black/30 tap-dark">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> Change Password
                </CardTitle>
                <CardDescription>
                  Enter your old and new password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Old Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({
                        ...p,
                        oldPassword: e.target.value,
                      }))
                    }
                    className="border-black/30 tap-dark"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                    className="border-black/30 tap-dark"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="border-black/30 tap-dark"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className=" px-6">
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Updating...
                    </>
                  ) : (
                    <>Update Password</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-6">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <Skeleton className="h-52 md:col-span-1" />
        <div className="md:col-span-2 space-y-8">
          <Skeleton className="h-56" />
          <Skeleton className="h-[22rem]" />
        </div>
      </div>
    </div>
  );
}
