"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckSquare, Square, Loader2, Save } from "lucide-react";
import type { StoreItem, Bundle } from "@/app/generated/prisma/browser";
import { toggleItemInBundle } from "@/app/actions/adminOps";
import { toast } from "sonner";

type BundleWithItems = Bundle & { items: StoreItem[] };

interface ManageItemsSheetProps {
    bundle: BundleWithItems | null;
    allItems: StoreItem[];
    session: any;
    onClose: () => void;
    onSaved: () => void;
}

export function ManageItemsSheet({
    bundle,
    allItems,
    session,
    onClose,
    onSaved,
}: ManageItemsSheetProps) {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Sync selection when bundle changes
    useEffect(() => {
        if (bundle) {
            setSelectedIds(bundle.items.map((i) => i.id));
            setSearch("");
        }
    }, [bundle]);

    const filteredItems = useMemo(
        () =>
            allItems.filter((item) => {
                // Hide items that belong to a different bundle
                if (item.bundleId && item.bundleId !== bundle?.id) return false;
                return (
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.category.toLowerCase().includes(search.toLowerCase())
                );
            }),
        [allItems, search, bundle]
    );

    const toggle = (itemId: number) => {
        setSelectedIds((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSave = async () => {
        if (!bundle || !session) return;
        setIsSaving(true);

        const currentIds = bundle.items.map((i) => i.id);
        const toAdd = selectedIds.filter((id) => !currentIds.includes(id));
        const toRemove = currentIds.filter((id) => !selectedIds.includes(id));

        try {
            await Promise.all([
                ...toAdd.map((id) => toggleItemInBundle(id, bundle.id, session)),
                ...toRemove.map((id) => toggleItemInBundle(id, null, session)),
            ]);
            toast.success(`Bundle updated — ${toAdd.length} added, ${toRemove.length} removed`);
            onSaved();
        } catch {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const currentIds = bundle?.items.map((i) => i.id) ?? [];
    const hasChanges =
        selectedIds.length !== currentIds.length ||
        selectedIds.some((id) => !currentIds.includes(id));

    return (
        <Sheet open={!!bundle} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="responsive-right"
                className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-light-overlay overflow-hidden"
            >
                <div className="flex flex-col h-full bg-gray-50/30">
                    {/* Header */}
                    <SheetHeader className="p-8 md:p-10 pb-6 bg-white border-b border-gray-100">
                        <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">
                            Manage Items
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                            Select items to add to this bundle. Items in other bundles will be removed.
                        </SheetDescription>

                        {selectedIds.length > 0 && (
                            <div className="mt-4 p-3 bg-[#5C9952]/5 border border-[#5C9952]/10 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">Combined Toolkit Value</span>
                                <span className="text-lg font-black text-[#2D4A29]">
                                    £{allItems
                                        .filter(i => selectedIds.includes(i.id))
                                        .reduce((acc, curr) => acc + curr.price, 0)
                                        .toFixed(2)
                                    }
                                </span>
                            </div>
                        )}

                        <div className="relative mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search items…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-11 h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                            />
                        </div>
                    </SheetHeader>

                    {/* Items list */}
                    <div className="flex-1 overflow-y-auto styled-scrollbar p-8 space-y-3">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                                <Search className="h-8 w-8 opacity-20" />
                                <p className="text-sm italic">No items match your search.</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selectedIds.includes(item.id);
                                const inOtherBundle = item.bundleId && item.bundleId !== bundle?.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        disabled={!!inOtherBundle}
                                        onClick={() => toggle(item.id)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                                            isSelected
                                                ? "bg-white border-[#5C9952] shadow-sm ring-1 ring-[#5C9952]/5"
                                                : "bg-white border-black/5 hover:bg-gray-50 hover:border-black/10"
                                        } ${inOtherBundle ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                                            isSelected ? "bg-[#5C9952] border-[#5C9952]" : "bg-white border-gray-300"
                                        }`}>
                                            {isSelected && <CheckSquare className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-black/10 shadow-sm">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-black text-[#2D4A29] truncate">
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                                                {item.category}
                                                {inOtherBundle && (
                                                    <span className="ml-2 text-red-500">
                                                        · in other bundle
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white border-t border-gray-100 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-14 cursor-pointer rounded-xl border-gray-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="flex-[2] h-14 cursor-pointer bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                                <>
                                    Save Changes
                                    {hasChanges && (
                                        <Badge className="ml-2 h-5 px-1.5 bg-white/20 text-white text-[10px] font-bold">
                                            {selectedIds.length} items
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
