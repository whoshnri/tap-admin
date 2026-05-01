"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bundleSchema, BundleFormData } from "./bundleSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BundleCategory } from "@/app/generated/prisma/enums";
import type { Bundle, StoreItem } from "@/app/generated/prisma/browser";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, X, CheckSquare, Square, Link as LinkIcon } from "lucide-react";
import { UploadComponent } from "@/components/upload/UploadComponent";

interface BundleFormProps {
    initialData?: Partial<Bundle> & { items?: StoreItem[] } | null;
    allItems: StoreItem[];
    onSubmit: (data: BundleFormData) => void;
    isPending: boolean;
    onCancel: () => void;
}

export function BundleForm({
    initialData,
    allItems,
    onSubmit,
    isPending,
    onCancel
}: BundleFormProps) {
    const [useUpload, setUseUpload] = useState(true);
    const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
    const initialItemIds = initialData?.items?.map((i) => i.id) ?? [];

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm<BundleFormData>({
        resolver: zodResolver(bundleSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            imageUrl: initialData?.imageUrl || "",
            category: initialData?.category || BundleCategory.school_advocacy,
            desc: initialData?.desc || "",
            price: initialData?.price ?? 0,
            cta: initialData?.cta || "Buy Bundle",
            badge: initialData?.badge || "",
            includes: initialData?.includes || [],
            assignedItemIds: initialItemIds,
        }
    });

    useEffect(() => {
        const ids = initialData?.items?.map((i) => i.id) ?? [];
        reset({
            name: initialData?.name || "",
            imageUrl: initialData?.imageUrl || "",
            category: initialData?.category || BundleCategory.school_advocacy,
            desc: initialData?.desc || "",
            price: initialData?.price ?? 0,
            cta: initialData?.cta || "Buy Bundle",
            badge: initialData?.badge || "",
            includes: initialData?.includes || [],
            assignedItemIds: ids,
            total: initialData?.total ?? 0,
        });
    }, [initialData, reset]);

    const selectedCategory = watch("category");
    const assignedItemIds = watch("assignedItemIds") ?? [];
    const bundlePrice = watch("price") ?? 0;

    const assignedItems = allItems.filter((i) => assignedItemIds.includes(i.id));
    const totalValue = assignedItems.reduce((acc, item) => acc + item.price, 0);

    useEffect(() => {
        setValue("total", totalValue, { shouldValidate: false });
    }, [totalValue, setValue]);

    const savings = totalValue - bundlePrice;
    const discountPercentage = totalValue > 0 ? Math.round((savings / totalValue) * 100) : 0;

    // Multi-select combobox state
    const [comboSearch, setComboSearch] = useState("");
    const [comboOpen, setComboOpen] = useState(false);
    const comboRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
                setComboOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredItems = allItems.filter((item) => {
        // Exclude items that belong to a different bundle entirely
        const inOtherBundle = item.bundleId && item.bundleId !== initialData?.id;
        if (inOtherBundle) return false;
        // Then apply search filter
        return (
            item.name.toLowerCase().includes(comboSearch.toLowerCase()) ||
            item.category.toLowerCase().includes(comboSearch.toLowerCase())
        );
    });

    const toggleItem = (itemId: number) => {
        const current = assignedItemIds;
        const updated = current.includes(itemId)
            ? current.filter((id) => id !== itemId)
            : [...current, itemId];
        setValue("assignedItemIds", updated, { shouldValidate: false });
    };

    const removeItem = (itemId: number) => {
        setValue(
            "assignedItemIds",
            assignedItemIds.filter((id) => id !== itemId),
            { shouldValidate: false }
        );
    };

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
            {/* Name */}
            <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-xs font-semibold ml-1">Bundle Name</Label>
                <Input
                    id="name"
                    {...register("name")}
                    className="h-12 rounded-xl border-gray-100 focus:border-green-500 px-4 bg-white"
                    placeholder="e.g. Advocacy Power Pack"
                />
                {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold ml-1">Category</Label>
                    <Select
                        value={selectedCategory}
                        onValueChange={(val) => setValue("category", val as BundleCategory)}
                    >
                        <SelectTrigger className="py-6 rounded-xl border-gray-100 px-4 bg-white">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-black/10">
                            {Object.values(BundleCategory).map(cat => (
                                <SelectItem key={cat} value={cat}>
                                    {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-[10px] ml-1">{errors.category.message}</p>}
                </div>
                <div className="grid gap-1.5 ">
                    <Label htmlFor="price" className="text-xs font-semibold ml-1">Bundle Price (£)</Label>
                    <div className="relative">
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            {...register("price", { valueAsNumber: true })}
                            className="h-12 rounded-xl border-gray-100 focus:border-green-500 px-4 bg-white"
                        />
                    </div>
                    {errors.price && <p className="text-red-500 text-[10px] ml-1">{errors.price.message}</p>}
                    
                </div>
                {totalValue > 0 && (
                       <div className="text-base col-span-2 bg-green-400 text-white px-3 py-2 rounded-xl font-medium ml-1 flex justify-between">
                           <span>Combined Value: £{totalValue.toFixed(2)}</span>
                           {savings > 0 && <span className="">£{savings.toFixed(2)} off</span>}
                       </div>
                    )}
            </div>

            {/* Image Source Toggle */}
            <div className="grid gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mb-1">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-xs font-semibold">Cover Image Source</Label>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold transition-colors", !useUpload ? "text-[#5C9952]" : "text-gray-400")}>URL</span>
                        <Switch 
                            checked={useUpload} 
                            onCheckedChange={setUseUpload}
                            style={{ backgroundColor: useUpload ? "#5C9952" : "#fff", height: "18px" }}
                        />
                        <span className={cn("text-[10px] font-bold transition-colors", useUpload ? "text-[#5C9952]" : "text-gray-400")}>Upload</span>
                    </div>
                </div>

                {useUpload ? (
                    <div className="grid gap-2">
                        <UploadComponent 
                            maxFiles={1} 
                            accept="image/*"
                            onUploadComplete={(url) => {
                                setValue("imageUrl", url, { shouldValidate: true });
                            }}
                        />
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="imageUrl"
                                {...register("imageUrl")}
                                className="h-12 rounded-xl border-gray-100 focus:border-green-500 pl-10 pr-4 bg-white text-xs"
                                placeholder="https://image-url.com/..."
                            />
                        </div>
                        {errors.imageUrl && <p className="text-red-500 text-[10px] ml-1">{errors.imageUrl.message}</p>}
                    </div>
                )}

                {/* Image Preview Area */}
                {!useUpload && watch("imageUrl") && watch("imageUrl") !== dismissedUrl && (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-gray-100 flex flex-col gap-2 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Image Preview</span>
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-gray-400"
                                onClick={() => setDismissedUrl(watch("imageUrl"))}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                            <img 
                                src={watch("imageUrl")} 
                                alt="Bundle cover" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
                <Label htmlFor="desc" className="text-xs font-semibold ml-1">Description</Label>
                <Textarea
                    id="desc"
                    {...register("desc")}
                    className="min-h-[100px] rounded-xl border-gray-100 focus:border-green-500 p-4 bg-white"
                    placeholder="What's in this bundle?"
                />
                {errors.desc && <p className="text-red-500 text-[10px] ml-1">{errors.desc.message}</p>}
            </div>

            {/* Badge + CTA */}
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="badge" className="text-xs font-semibold ml-1">Badge</Label>
                    <Input id="badge" {...register("badge")} className="h-12 rounded-xl border-gray-100 bg-white" placeholder="SAVE 30%, NEW…" />
                    {errors.badge && <p className="text-red-500 text-[10px] ml-1">{errors.badge.message}</p>}
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="cta" className="text-xs font-semibold ml-1">Button CTA</Label>
                    <Input id="cta" {...register("cta")} className="h-12 rounded-xl border-gray-100 bg-white" placeholder="Buy Bundle" />
                    {errors.cta && <p className="text-red-500 text-[10px] ml-1">{errors.cta.message}</p>}
                </div>
            </div>

            {/* ---- Item Assignment ---- */}
            <div className="grid gap-2">
                <Label className="text-xs font-semibold ml-1">Assign Store Items</Label>

                {/* Combobox trigger */}
                <div ref={comboRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setComboOpen((o) => !o)}
                        className="w-full h-12 flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 text-sm text-left text-gray-500 hover:border-green-300 transition-colors"
                    >
                        <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="flex-1 truncate">
                            {assignedItemIds.length > 0
                                ? `${assignedItemIds.length} item${assignedItemIds.length > 1 ? "s" : ""} selected — click to change`
                                : "Search and select store items…"}
                        </span>
                    </button>

                    {comboOpen && (
                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-black/8 bg-white shadow-xl overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                                    <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                    <input
                                        autoFocus
                                        value={comboSearch}
                                        onChange={(e) => setComboSearch(e.target.value)}
                                        placeholder="Filter items…"
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                                    />
                                    {comboSearch && (
                                        <button type="button" onClick={() => setComboSearch("")}>
                                            <X className="h-3.5 w-3.5 text-gray-400" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-52 overflow-y-auto styled-scrollbar">
                                {filteredItems.length === 0 ? (
                                    <p className="text-xs text-center text-gray-400 py-6">No items match your search</p>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isSelected = assignedItemIds.includes(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleItem(item.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors ${isSelected ? "bg-green-50/60" : ""}`}
                                            >
                                                {isSelected
                                                    ? <CheckSquare className="h-4 w-4 text-[#5C9952] flex-shrink-0" />
                                                    : <Square className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-black/5">
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{item.category}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Assigned chips */}
                {assignedItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {assignedItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-1.5 bg-[#5C9952]/10 border border-[#5C9952]/25 rounded-xl pl-1.5 pr-2 py-0.5"
                            >
                                <div className="w-5 h-5 rounded-xl overflow-hidden flex-shrink-0 border border-[#5C9952]/30">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[11px] font-semibold text-[#2D4A29] max-w-[120px] truncate">{item.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="rounded-full cursor-pointer hover:bg-red-100 transition-colors p-0.5 ml-0.5"
                                >
                                    <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-14 rounded-xl border-gray-200"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-[2] h-14 bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl font-semibold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="animate-spin" /> : "Save Bundle"}
                </Button>
            </div>
        </form>
    );
}
