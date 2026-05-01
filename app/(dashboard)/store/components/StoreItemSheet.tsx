"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StoreItemForm } from "./StoreItemForm";
import { StoreItemFormData } from "./schema";
import { Bundle, StoreItem } from "@/app/generated/prisma/client";

interface StoreItemSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    itemToEdit: StoreItem | null;
    bundles: Bundle[];
    onSubmit: (data: StoreItemFormData) => void;
    isPending: boolean;
}

export function StoreItemSheet({
    isOpen,
    onOpenChange,
    itemToEdit,
    bundles,
    onSubmit,
    isPending
}: StoreItemSheetProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-dark overflow-hidden">
                <div className="flex flex-col h-full bg-gray-50/30">
                    <SheetHeader className="p-6 bg-white border-b border-gray-100">
                        <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">
                            {itemToEdit ? "Edit Item" : "Add New Item"}
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                            {itemToEdit
                                ? "Update the details and bundle assignment for this store item."
                                : "Fill out the details below to create a new resource or product."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 styled-scrollbar">
                        <StoreItemForm 
                            initialData={itemToEdit || undefined}
                            onSubmit={onSubmit}
                            isPending={isPending}
                            bundles={bundles}
                            onCancel={() => onOpenChange(false)}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
