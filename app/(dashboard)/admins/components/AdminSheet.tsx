"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Roles } from "@/app/generated/prisma/enums";
import type { Admins } from "@/app/generated/prisma/browser";
import {
    addAdminSchema,
    editRoleSchema,
    resetPasswordSchema,
    AddAdminFormData,
    EditRoleFormData,
    ResetPasswordFormData,
} from "./adminSchema";

type AdminSheetMode = "add" | "edit-role" | "reset-password";

interface AdminSheetProps {
    mode: AdminSheetMode | null;
    admin?: Admins | null;
    isPending: boolean;
    onClose: () => void;
    onAddSubmit: (data: AddAdminFormData) => void;
    onEditRoleSubmit: (data: EditRoleFormData) => void;
    onResetPasswordSubmit: (data: ResetPasswordFormData) => void;
}

export function AdminSheet({
    mode,
    admin,
    isPending,
    onClose,
    onAddSubmit,
    onEditRoleSubmit,
    onResetPasswordSubmit,
}: AdminSheetProps) {
    const config = {
        "add": {
            title: "Add New Admin",
            desc: "Create a new administrator account. Master key required.",
        },
        "edit-role": {
            title: "Edit Admin Role",
            desc: `Change the permission level for ${admin?.name ?? "this admin"}.`,
        },
        "reset-password": {
            title: "Reset Password",
            desc: `Set a new password for ${admin?.name ?? "this admin"}. Master key required.`,
        },
    };

    return (
        <Sheet open={!!mode} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="responsive-right"
                className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-light-overlay overflow-hidden"
            >
                <div className="flex flex-col h-full bg-gray-50/30">
                    <SheetHeader className="p-8  pb-6 bg-white border-b border-gray-100">
                        <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">
                            {mode && config[mode]?.title}
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                            {mode && config[mode]?.desc}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 styled-scrollbar">
                        {mode === "add" && (
                            <AddAdminForm
                                onSubmit={onAddSubmit}
                                isPending={isPending}
                                onCancel={onClose}
                            />
                        )}
                        {mode === "edit-role" && admin && (
                            <EditRoleForm
                                admin={admin}
                                onSubmit={onEditRoleSubmit}
                                isPending={isPending}
                                onCancel={onClose}
                            />
                        )}
                        {mode === "reset-password" && admin && (
                            <ResetPasswordForm
                                onSubmit={onResetPasswordSubmit}
                                isPending={isPending}
                                onCancel={onClose}
                            />
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ---- Add Admin Form ----
function AddAdminForm({
    onSubmit,
    isPending,
    onCancel,
}: {
    onSubmit: (data: AddAdminFormData) => void;
    isPending: boolean;
    onCancel: () => void;
}) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } =
        useForm<AddAdminFormData>({
            resolver: zodResolver(addAdminSchema) as any,
            defaultValues: { role: Roles.Other },
        });

    const selectedRole = watch("role");

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Full Name</Label>
                <Input {...register("name")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="e.g. Jane Smith" />
                {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Email Address</Label>
                <Input type="email" {...register("email")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="admin@example.com" />
                {errors.email && <p className="text-red-500 text-[10px] ml-1">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Password</Label>
                <Input type="password" {...register("password")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="Min. 8 characters" />
                {errors.password && <p className="text-red-500 text-[10px] ml-1">{errors.password.message}</p>}
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setValue("role", v as Roles)}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-white px-4">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/10">
                        {Object.values(Roles).map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-[10px] ml-1">{errors.role.message}</p>}
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Master Key</Label>
                <Input type="password" {...register("master_key")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="Authorization required" />
                {errors.master_key && <p className="text-red-500 text-[10px] ml-1">{errors.master_key.message}</p>}
            </div>
            <SheetActions isPending={isPending} onCancel={onCancel} label="Create Admin" />
        </form>
    );
}

// ---- Edit Role Form ----
function EditRoleForm({
    admin,
    onSubmit,
    isPending,
    onCancel,
}: {
    admin: Admins;
    onSubmit: (data: EditRoleFormData) => void;
    isPending: boolean;
    onCancel: () => void;
}) {
    const { handleSubmit, setValue, watch, formState: { errors } } =
        useForm<EditRoleFormData>({
            resolver: zodResolver(editRoleSchema) as any,
            defaultValues: { role: admin.role },
        });

    useEffect(() => {
        setValue("role", admin.role);
    }, [admin, setValue]);

    const selectedRole = watch("role");

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Admin</p>
                <p className="font-bold text-gray-800">{admin.name}</p>
                <p className="text-sm text-gray-500">{admin.email}</p>
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">New Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setValue("role", v as Roles)}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-white px-4">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/10">
                        {Object.values(Roles).map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-[10px] ml-1">{errors.role.message}</p>}
            </div>
            <SheetActions
                isPending={isPending}
                onCancel={onCancel}
                label="Save Role"
                disabled={selectedRole === admin.role}
            />
        </form>
    );
}

// ---- Reset Password Form ----
function ResetPasswordForm({
    onSubmit,
    isPending,
    onCancel,
}: {
    onSubmit: (data: ResetPasswordFormData) => void;
    isPending: boolean;
    onCancel: () => void;
}) {
    const { register, handleSubmit, formState: { errors } } =
        useForm<ResetPasswordFormData>({
            resolver: zodResolver(resetPasswordSchema) as any,
        });

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">New Password</Label>
                <Input type="password" {...register("newPassword")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="Min. 8 characters" />
                {errors.newPassword && <p className="text-red-500 text-[10px] ml-1">{errors.newPassword.message}</p>}
            </div>
            <div className="grid gap-1.5">
                <Label className="text-xs font-medium ml-1">Master Key</Label>
                <Input type="password" {...register("master_key")} className="h-12 rounded-xl border-gray-100 bg-white px-4" placeholder="Authorization required" />
                {errors.master_key && <p className="text-red-500 text-[10px] ml-1">{errors.master_key.message}</p>}
            </div>
            <SheetActions isPending={isPending} onCancel={onCancel} label="Update Password" />
        </form>
    );
}

// ---- Shared Action Buttons ----
function SheetActions({
    isPending,
    onCancel,
    label,
    disabled,
}: {
    isPending: boolean;
    onCancel: () => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div className="pt-4 flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-xl border-gray-200">
                Cancel
            </Button>
            <Button
                type="submit"
                disabled={isPending || disabled}
                className="flex-[2] h-14 bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl font-medium shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
                {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : label}
            </Button>
        </div>
    );
}
