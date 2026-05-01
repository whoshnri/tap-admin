"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { BundleForm } from "./BundleForm";
import { BundleFormData } from "./bundleSchema";
import type { Bundle, StoreItem } from "@/app/generated/prisma/browser";

interface BundleWithItems extends Bundle {
    items: StoreItem[];
}

interface BundleSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    bundleToEdit: BundleWithItems | null;
    allItems: StoreItem[];
    onSubmit: (data: BundleFormData) => void;
    isPending: boolean;
}

export function BundleSheet({
    isOpen,
    onOpenChange,
    bundleToEdit,
    allItems,
    onSubmit,
    isPending,
}: BundleSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-light-overlay overflow-hidden">
                <div className="flex flex-col h-full bg-gray-50/30">
                    <SheetHeader className="p-4  md:p-6  bg-white border-b border-gray-100">
                        <SheetTitle className="text-3xl font-black text-[#2D4A29]">
                            {bundleToEdit ? "Edit Bundle" : "Create Bundle"}
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                            {bundleToEdit
                                ? "Update this bundle's details and assigned store items."
                                : "Design a new bundle. Assign store items directly from this panel."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 styled-scrollbar">
                        <BundleForm
                            initialData={bundleToEdit}
                            allItems={allItems}
                            onSubmit={onSubmit}
                            isPending={isPending}
                            onCancel={() => onOpenChange(false)}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
