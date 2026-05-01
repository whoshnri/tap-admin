"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeItemSchema, StoreItemFormData } from "./schema";
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
import { StoreCategory } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import { UploadComponent } from "@/components/upload/UploadComponent";
import type { Bundle, StoreItem } from "@/app/generated/prisma/browser";

interface StoreItemFormProps {
    initialData?: Partial<StoreItem> | null;
    onSubmit: (data: StoreItemFormData) => void;
    isPending: boolean;
    bundles: Bundle[];
    onCancel: () => void;
}

export function StoreItemForm({
    initialData,
    onSubmit,
    isPending,
    bundles,
    onCancel
}: StoreItemFormProps) {
    const [useUpload, setUseUpload] = useState(true);
    const [useDownloadUpload, setUseDownloadUpload] = useState(false);
    const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm<StoreItemFormData>({
        resolver: zodResolver(storeItemSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            imageUrl: initialData?.imageUrl || "",
            category: (initialData?.category as StoreCategory) || StoreCategory.All,
            desc: initialData?.desc || "",
            price: typeof initialData?.price === 'number' ? initialData.price : 0,
            cta: initialData?.cta || "Buy Now",
            beaconLink: initialData?.beaconLink || "",
            bundleId: initialData?.bundleId ?? null,
            downloadLink: initialData?.downloadLink || "",
            badge: initialData?.badge || "",
            goodFor: initialData?.goodFor || "",
            free: initialData?.free || false,
        }
    });

    useEffect(() => {
        reset({
            name: initialData?.name || "",
            imageUrl: initialData?.imageUrl || "",
            category: (initialData?.category as StoreCategory) || StoreCategory.All,
            desc: initialData?.desc || "",
            price: initialData?.price ?? 0,
            cta: initialData?.cta || "Buy Now",
            beaconLink: initialData?.beaconLink || "",
            bundleId: initialData?.bundleId ?? null,
            downloadLink: initialData?.downloadLink || "",
            badge: initialData?.badge || "",
            goodFor: initialData?.goodFor || "",
            free: initialData?.free || false,
        });
    }, [initialData, reset]);

    const selectedCategory = watch("category");
    const selectedBundleId = watch("bundleId");

    return (
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-medium  ml-1">Name</Label>
                    <Input
                        id="name"
                        {...register("name")}
                        className="h-12 rounded-xl border-gray-100 focus:border-green-500 focus:ring-green-500/10 px-4 bg-white"
                        placeholder="Product Name"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category" className="text-xs font-medium  ml-1">Category</Label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(val) => setValue("category", val as StoreCategory)}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-gray-100 px-4 bg-white">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-black/10">
                                {Object.values(StoreCategory).map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-500 text-[10px] ml-1">{errors.category.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="price" className="text-xs font-medium  ml-1">Price (£)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            {...register("price", { valueAsNumber: true })}
                            className="h-12 rounded-xl border-gray-100 focus:border-green-500 focus:ring-green-500/10 px-4 bg-white"
                        />
                        {errors.price && <p className="text-red-500 text-[10px] ml-1">{errors.price.message}</p>}
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="bundleId" className="text-xs font-medium  ml-1">Bundle Assignment</Label>
                    <Select
                        value={selectedBundleId?.toString() || "none"}
                        onValueChange={(val) => setValue("bundleId", val === "none" ? null : parseInt(val))}
                    >
                        <SelectTrigger className="h-12 rounded-xl border-gray-100 px-4 bg-white">
                            <SelectValue placeholder="Assign to bundle" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-black/10">
                            <SelectItem value="none">No Bundle (Available Individually)</SelectItem>
                            {bundles.map(bundle => (
                                <SelectItem key={bundle.id} value={bundle.id.toString()}>{bundle.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-gray-400 font-medium ml-1 italic mt-1">
                        Note: Items in a bundle are typically marked as ATB (Access Through Bundle) if price is £0.
                    </p>
                </div>

                <div className="grid gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
                    <div className="flex items-center justify-between px-1">
                        <Label className="text-xs font-medium ">Image Source</Label>
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
                                    className="h-10 rounded-xl border-gray-100 focus:border-green-500 focus:ring-green-500/10 pl-10 pr-4 bg-white text-[10px]"
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
                                <span className="text-[9px] font-medium text-gray-400 uppercase">Image Preview</span>
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
                                    alt="Selected product"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="desc" className="text-xs font-medium  ml-1">Description</Label>
                    <Textarea
                        id="desc"
                        {...register("desc")}
                        className="min-h-[120px] rounded-xl border-gray-100 focus:border-green-500 focus:ring-green-500/10 p-4 bg-white"
                        placeholder="Detailed product description..."
                    />
                    {errors.desc && <p className="text-red-500 text-[10px] ml-1">{errors.desc.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="badge" className="text-xs font-medium  ml-1">Badge</Label>
                        <Input id="badge" {...register("badge")} className="h-12 rounded-xl border-gray-100 bg-white" placeholder="FREE, NEW, etc." />
                        {errors.badge && <p className="text-red-500 text-[10px] ml-1">{errors.badge.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cta" className="text-xs font-medium  ml-1">CTA Text</Label>
                        <Input id="cta" {...register("cta")} className="h-12 rounded-xl border-gray-100 bg-white" placeholder="Buy Now" />
                        {errors.cta && <p className="text-red-500 text-[10px] ml-1">{errors.cta.message}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#5C9952]/5 rounded-2xl border border-[#5C9952]/10">
                    <div className="grid gap-1">
                        <Label htmlFor="free" className="text-sm font-medium text-[#2D4A29]">Mark as FREE</Label>
                        <p className="text-[10px] text-gray-500">Makes the item available for direct download without purchase.</p>
                    </div>
                    <Switch
                        id="free"
                        checked={watch("free")}
                        onCheckedChange={(checked) => setValue("free", checked, { shouldValidate: true })}
                        style={{ backgroundColor: watch("free") ? "#5C9952" : "#ccc" }}
                    />
                </div>

                <div className="grid gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
                    <div className="flex items-center justify-between px-1">
                        <div className="grid gap-1">
                            <Label className="text-xs font-medium ">Resource File (Download Link)</Label>
                            <p className="text-[10px] text-gray-500">The actual file users will download.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-bold transition-colors", !useDownloadUpload ? "text-[#5C9952]" : "text-gray-400")}>URL</span>
                            <Switch
                                checked={useDownloadUpload}
                                onCheckedChange={setUseDownloadUpload}
                                style={{ backgroundColor: useDownloadUpload ? "#5C9952" : "#fff", height: "18px" }}
                            />
                            <span className={cn("text-[10px] font-bold transition-colors", useDownloadUpload ? "text-[#5C9952]" : "text-gray-400")}>Upload</span>
                        </div>
                    </div>

                    {useDownloadUpload ? (
                        <div className="grid gap-2">
                            <UploadComponent
                                maxFiles={1}
                                accept="application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                                onUploadComplete={(url) => {
                                    setValue("downloadLink", url, { shouldValidate: true });
                                }}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="downloadLink"
                                    {...register("downloadLink")}
                                    className="h-10 rounded-xl border-gray-100 focus:border-green-500 focus:ring-green-500/10 pl-10 pr-4 bg-white text-[10px]"
                                    placeholder="https://resource-url.com/file.pdf"
                                />
                            </div>
                            {errors.downloadLink && <p className="text-red-500 text-[10px] ml-1">{errors.downloadLink.message}</p>}
                        </div>
                    )}


                </div>
            </div>

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
                    className="flex-[2] h-14 bg-[#2D4A29] hover:bg-[#5C9952] text-white rounded-xl font-medium shadow-lg transition-all active:opacty-75 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="animate-spin" /> : "Save Product"}
                </Button>
            </div>
        </form>
    );
}
