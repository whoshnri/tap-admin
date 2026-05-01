"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { UploadComponent } from "@/components/upload/UploadComponent";
import { Link as LinkIcon, ArrowRight, ChevronLeft, Loader2, Save, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { createBlog, fetchBlogCategories, getAllNextSteps } from "@/app/actions/blogOps";
import { toast } from "sonner";
import { BlogCategory, BlogAudience } from "@/app/generated/prisma/enums";
import { formatBlogCategory, formatBlogAudience } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blogSchema, type BlogFormValues } from "@/lib/validations/blog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

const COLORS = {
  gray: "#5C9952",
  darkgray: "#4a7c42",
};

export default function NewBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [useUpload, setUseUpload] = useState(true);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(Object.values(BlogCategory));
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [availableNextSteps, setAvailableNextSteps] = useState<{ id: number; title: string }[]>([]);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      subtitle: "",
      category: BlogCategory.parenting,
      image: "",
      excerpt: "",
      authorName: "The African Parent",
      featured: false,
      published: true,
      content: "",
      nextSteps: [],
      showCallout: false,
    },
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadData() {
      try {
        const [cats, steps] = await Promise.all([
          fetchBlogCategories(),
          getAllNextSteps()
        ]);
        if (cats && cats.length > 0) {
          setCategories(cats.filter(c => c !== "All Posts"));
        }
        setAvailableNextSteps(steps);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  // Auto-generate slug from title
  const titleValue = form.watch("title");
  useEffect(() => {
    if (titleValue) {
      const generatedSlug = titleValue
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [titleValue, form]);

  const onSubmit = async (values: BlogFormValues) => {
    setLoading(true);
    try {
      const result = await createBlog(values);

      if (result.success) {
        toast.success("Blog post created successfully!");
        router.push("/blogs");
      } else {
        toast.error(result.error || "Failed to create blog post.");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-6 min-h-full tap-dark">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/blogs" className="tap-dark border-gray-400 border rounded-xl hover:bg-black/10">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 font-poppins">Create New Blog Post</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-gray-700">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Supporting Your Child's Learning"
                      {...field}
                      className="border-gray-200 shadow-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-gray-700">Slug (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e-g-supporting-your-childs-learning"
                      {...field}
                      className="border-gray-200 shadow-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
                    Auto-generated from title, but can be customized.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subtitle */}
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-gray-700">Subtitle (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="A brief catchy line below the title"
                      {...field}
                      className="border-gray-200 shadow-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-2 relative">
                  <FormLabel className="text-sm text-gray-700">Category</FormLabel>
                  <div className="relative">
                    <Input
                      placeholder="Search or type a category..."
                      value={isCategoryOpen ? categorySearch : field.value}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setIsCategoryOpen(true);
                      }}
                      onFocus={() => {
                        setCategorySearch("");
                        setIsCategoryOpen(true);
                      }}
                      ref={field.ref}
                      className="border-gray-200 shadow-none focus:ring-gray-500 focus:border-gray-500"
                    />
                    
                    {isCategoryOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {categories
                          .filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map((cat) => (
                            <div
                              key={cat}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 transition-colors"
                              onClick={() => {
                                // Map label to enum value (lowercase)
                                const enumValue = cat.toLowerCase().replace(/\s+/g, '_');
                                field.onChange(enumValue);
                                setIsCategoryOpen(false);
                              }}
                            >
                              {formatBlogCategory(cat)}
                            </div>
                          ))}
                        
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategories */}
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm text-gray-700 font-bold">Subcategories</FormLabel>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    {Object.values(BlogCategory).map((cat) => {
                      const isPrimary = form.watch("category") === cat;
                      return (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat}`}
                            checked={field.value?.includes(cat) || isPrimary}
                            disabled={isPrimary}
                            onCheckedChange={(checked: boolean) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, cat]);
                              } else {
                                field.onChange(current.filter((c) => c !== cat));
                              }
                            }}
                          />
                          <label
                            htmlFor={`cat-${cat}`}
                            className={`text-xs font-medium leading-none cursor-pointer ${isPrimary ? "text-[#5C9952] font-bold" : "text-gray-600"}`}
                          >
                            {formatBlogCategory(cat)}
                            {isPrimary && " (Primary)"}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400">
                    The primary category is automatically included.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Image Section */}
            <div className="md:col-span-2">
                <div className="grid gap-3 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between px-1">
                        <Label className="text-sm font-bold text-gray-700">Featured Image Source</Label>
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
                                    form.setValue("image", url, { shouldValidate: true });
                                }}
                            />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormControl>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="https://example.com/image.jpg"
                                                    {...field}
                                                    className="border-gray-200 pl-10 h-12 rounded-xl focus:ring-gray-500"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    {/* Image Preview Area */}
                    {!useUpload && form.watch("image") && form.watch("image") !== dismissedUrl && (
                        <div className="mt-2 p-2 bg-white rounded-xl border border-gray-100 flex flex-col gap-2 animate-in fade-in duration-300">
                             <div className="flex items-center justify-between px-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase">Image Preview</span>
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-gray-400"
                                    onClick={() => setDismissedUrl(form.watch("image") || null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                             </div>
                             <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                                <img 
                                    src={form.watch("image")} 
                                    alt="Blog featured image" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                                    }}
                                />
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Author */}
            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-gray-700">Author Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="The African Parent"
                      {...field}
                      className="border-gray-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Audience */}
            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm text-gray-700">Audience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {Object.values(BlogAudience).map((aud) => (
                        <SelectItem key={aud} value={aud}>
                          {formatBlogAudience(aud)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Excerpt */}
          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm text-gray-700">Excerpt (Short Summary)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a short summary of the blog post..."
                    {...field}
                    className="border-gray-200 min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-6">
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      style={{ backgroundColor: field.value ? "#5C9952" : "#fff", height: "20px" }}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-700 cursor-pointer pt-2">Mark as Featured</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      style={{ backgroundColor: field.value ? "#5C9952" : "#fff", height: "20px" }}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-700 cursor-pointer pt-2">Publish Immediately</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showCallout"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      style={{ backgroundColor: field.value ? "#5C9952" : "#fff", height: "20px" }}
                      checked={form.watch("audience") == "parents" ? false : field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.watch("audience") !== "institutions"}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-gray-700 cursor-pointer pt-2">Show Educator Callout</FormLabel>
                </FormItem>
              )}
            />
          </div>

          {/* Next Steps Selection */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <Label className="text-sm font-bold text-gray-900">What to do next (Next Steps)</Label>
            <p className="text-sm text-gray-500">Select the actions that will appear at the bottom of the blog post.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50/30">
              {availableNextSteps.length > 0 ? (
                availableNextSteps.map((step) => {
                  const isSelected = form.watch("nextSteps")?.some(ns => ns.id === step.id);
                  return (
                    <div 
                      key={step.id}
                      onClick={() => {
                        const current = form.getValues("nextSteps") || [];
                        if (isSelected) {
                          form.setValue("nextSteps", current.filter(ns => ns.id !== step.id));
                        } else {
                          form.setValue("nextSteps", [...current, { id: step.id }]);
                        }
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#5C9952]/10 border-[#5C9952] text-[#5C9952]" 
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? "bg-[#5C9952] border-[#5C9952]" : "border-gray-300"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-gray-400">
                  <p>No next steps available. Create them in the Next Steps management page.</p>
                </div>
              )}
            </div>
            <Link href="/blog-next-steps" className=" text-sm text-[#5C9952] py-2 border font-medium px-2 rounded-xl flex items-center gap-2 w-fit group">
              Manage all next steps <ArrowRight className="group-hover:translate-x-1 transition-all duration-300"/>
            </Link>
          </div>

          {/* content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm text-gray-700">Content</FormLabel>
                <FormControl>
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm min-h-[500px]">
                    <TipTapEditor
                      initialContent={field.value}
                      onChange={field.onChange}
                      ref={field.ref}
                      label="Write your story..."
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#5C9952] hover:bg-[#4a7c42] text-white px-8 py-6 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Save Blog Post"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Click outside to close category dropdown */}
      {isCategoryOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsCategoryOpen(false)}
        />
      )}
    </div>
  );
}
