"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Plus, Pencil, Trash2, ExternalLink, Save, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAllNextSteps,
  createNextStep,
  updateNextStep,
  deleteNextStep
} from "@/app/actions/blogOps";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BlogNextStepsPage() {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepToDelete, setStepToDelete] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    link: "",
    desc: ""
  });

  useEffect(() => {
    loadSteps();
  }, []);

  async function loadSteps() {
    setLoading(true);
    try {
      const allSteps = await getAllNextSteps();
      setSteps(allSteps);
    } catch (error) {
      toast.error("Failed to load next steps.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenSheet = (step: any = null) => {
    if (step) {
      setEditingStep(step);
      setFormData({
        title: step.title,
        link: step.link,
        desc: step.desc || ""
      });
    } else {
      setEditingStep(null);
      setFormData({
        title: "",
        link: "",
        desc: ""
      });
    }
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStep) {
        const result = await updateNextStep(editingStep.id, formData);
        if (result.success) {
          toast.success("Next step updated successfully.");
          setSheetOpen(false);
          loadSteps();
        } else {
          toast.error(result.error || "Failed to update next step.");
        }
      } else {
        const result = await createNextStep(formData);
        if (result.success) {
          toast.success("Next step created successfully.");
          setSheetOpen(false);
          loadSteps();
        } else {
          toast.error(result.error || "Failed to create next step.");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!stepToDelete) return;
    try {
      const result = await deleteNextStep(stepToDelete.id);
      if (result.success) {
        toast.success("Next step deleted.");
        loadSteps();
      } else {
        toast.error(result.error || "Failed to delete next step.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setStepToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-6 min-h-full tap-dark">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/blogs" className="tap-dark border-gray-400 border rounded-xl hover:bg-black/10">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 font-poppins">Next Steps Manager</h1>
            <p className="text-xs font-bold text-[#5C9952] uppercase tracking-[0.2em]">Platform Resources</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-sm border border-black/5 rounded-3xl mb-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C9952] mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading your next steps...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-20">
          {/* Add New Step Card */}
          <div 
            onClick={() => handleOpenSheet()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#5C9952] hover:bg-[#5C9952]/5 transition-all cursor-pointer group h-full min-h-[160px] bg-white/20 backdrop-blur-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center  transition-all duration-300">
              <Plus className="h-5 w-5 text-gray-400 group-hover:text-[#5C9952]" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 text-sm">Add Next Step</p>
            </div>
          </div>

          {/* Existing Steps Cards */}
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm transition-all duration-300 group relative flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#5C9952]/10 flex items-center justify-center group-hover:bg-[#5C9952] transition-colors duration-300">
                  <ExternalLink className="h-4 w-4 text-[#5C9952] group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-y-[-5px] md:group-hover:translate-y-0 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-gray-50 text-gray-400 hover:text-[#5C9952] hover:bg-[#5C9952]/10 transition-all"
                    onClick={() => handleOpenSheet(step)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-red-50 text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all"
                    onClick={() => setStepToDelete(step)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base mb-1.5 leading-tight group-hover:text-[#2D4A29] transition-colors line-clamp-1">{step.title}</h3>
                <p className="text-gray-500 text-xs font-medium line-clamp-2 mb-4 leading-relaxed">
                  {step.desc || "No description provided."}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-[#5C9952] uppercase tracking-widest bg-[#5C9952]/5 px-2.5 py-1.5 rounded-lg w-fit max-w-full overflow-hidden">
                  <span className="truncate">{step.link}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-dark overflow-hidden">
          <div className="flex flex-col h-full bg-gray-50/30">
            <SheetHeader className="p-8 pb-6 bg-white border-b border-gray-100">
              <SheetTitle className="text-3xl font-black text-[#2D4A29] leading-tight">
                {editingStep ? "Edit Next Step" : "Create Next Step"}
              </SheetTitle>
              <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                {editingStep 
                  ? "Update the details of this action." 
                  : "Add a new action that can be displayed at the bottom of blogs."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-8 styled-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-bold text-gray-700">Action Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Book a Free Consultation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-gray-200 shadow-none focus:ring-[#5C9952] focus:border-[#5C9952] rounded-xl py-6"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link" className="text-xs font-bold text-gray-700">Redirect Link (URL)</Label>
                  <Input
                    id="link"
                    placeholder="e.g., /services/consultation or https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="border-gray-200 shadow-none focus:ring-[#5C9952] focus:border-[#5C9952] rounded-xl py-6"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-xs font-bold text-gray-700">Description (Optional)</Label>
                  <Textarea
                    id="desc"
                    placeholder="Briefly describe what this action is about..."
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="border-gray-200 shadow-none focus:ring-[#5C9952] focus:border-[#5C9952] rounded-xl min-h-[120px]"
                  />
                </div>

                <div className="pt-8 flex gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setSheetOpen(false)}
                    className="flex-1 h-14 rounded-xl border border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-[2] bg-[#5C9952] hover:bg-[#4a7c42] text-white h-14 rounded-xl font-bold shadow-lg transition-all active:scale-95"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingStep ? (
                      "Update Action"
                    ) : (
                      "Create Action"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!stepToDelete}
        onOpenChange={() => setStepToDelete(null)}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">
              Delete Next Step?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-800">
                "{stepToDelete?.title}"
              </span>{" "}
              and remove it from all associated blog posts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2 ">
            <AlertDialogCancel className="border-black/10 hover:bg-gray-50">
              Keep Action
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
