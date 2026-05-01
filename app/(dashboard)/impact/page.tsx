"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X, 
  BarChart3, 
  FileText, 
  Settings2,
  ListRestart,
  Layout,
  Link as LinkIcon
} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import { UploadComponent } from "@/components/upload/UploadComponent";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  fetchImpactPatterns, 
  addImpactPattern, 
  updateImpactPattern, 
  deleteImpactPattern,
  fetchImpactReports,
  addImpactReport,
  updateImpactReport,
  deleteImpactReport
} from "@/app/actions/adminOps";
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

export default function AdminImpactPage() {
  const [activeTab, setActiveTab] = useState("patterns");
  const [patterns, setPatterns] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useUpload, setUseUpload] = useState(false);

  // Form states
  const [patternData, setPatternData] = useState({
    title: "",
    description: "",
    icon: "BarChart3",
    color: "#5C9952",
    order: 0
  });

  const [reportData, setReportData] = useState({
    title: "",
    description: "",
    link: "",
    fileUrl: "",
    published: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allPatterns, allReports] = await Promise.all([
        fetchImpactPatterns(),
        fetchImpactReports()
      ]);
      setPatterns(allPatterns);
      setReports(allReports);
    } catch (error) {
      toast.error("Failed to load impact data.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenSheet = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      if (activeTab === "patterns") {
        setPatternData({
          title: item.title,
          description: item.description,
          icon: item.icon,
          color: item.color,
          order: item.order
        });
      } else {
        setReportData({
          title: item.title,
          description: item.description || "",
          link: item.link || "",
          fileUrl: item.fileUrl || "",
          published: item.published
        });
      }
    } else {
      setEditingItem(null);
      if (activeTab === "patterns") {
        setPatternData({
          title: "",
          description: "",
          icon: "MessageSquareText",
          color: "#5C9952",
          order: patterns.length
        });
      } else {
        setReportData({
          title: "",
          description: "",
          link: "",
          fileUrl: "",
          published: true
        });
      }
    }
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === "patterns") {
        if (editingItem) {
          const result = await updateImpactPattern(editingItem.id, patternData);
          if (result.success) {
            toast.success("Pattern updated successfully.");
            setSheetOpen(false);
            loadData();
          } else {
            toast.error("Failed to update pattern.");
          }
        } else {
          const result = await addImpactPattern(patternData);
          if (result.success) {
            toast.success("Pattern created successfully.");
            setSheetOpen(false);
            loadData();
          } else {
            toast.error("Failed to create pattern.");
          }
        }
      } else {
        // Reports
        if (editingItem) {
          const result = await updateImpactReport(editingItem.id, reportData);
          if (result.success) {
            toast.success("Report updated successfully.");
            setSheetOpen(false);
            loadData();
          } else {
            toast.error("Failed to update report.");
          }
        } else {
          const result = await addImpactReport(reportData);
          if (result.success) {
            toast.success("Report created successfully.");
            setSheetOpen(false);
            loadData();
          } else {
            toast.error("Failed to create report.");
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (activeTab === "patterns") {
        const result = await deleteImpactPattern(itemToDelete.id);
        if (result.success) {
          toast.success("Pattern deleted.");
          loadData();
        } else {
          toast.error("Failed to delete pattern.");
        }
      } else {
        const result = await deleteImpactReport(itemToDelete.id);
        if (result.success) {
          toast.success("Report deleted.");
          loadData();
        } else {
          toast.error("Failed to delete report.");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-6 min-h-full tap-dark">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="tap-dark border-gray-400 border rounded-xl hover:bg-black/10">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 font-serif">Impact Page Manager</h1>
            <p className="text-xs font-bold text-[#5C9952] uppercase tracking-[0.2em]">Platform Resources</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="patterns" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/40 backdrop-blur-sm border border-black/5 p-1 mb-8 rounded-2xl h-14">
          <TabsTrigger value="patterns" className="rounded-xl h-full data-[state=active]:bg-[#5C9952] data-[state=active]:text-white font-bold px-8 transition-all">
            Impact Patterns
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl h-full data-[state=active]:bg-[#5C9952] data-[state=active]:text-white font-bold px-8 transition-all">
            Research & Reports
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm border border-black/5 rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-[#5C9952] mb-3" />
            <p className="text-gray-500 font-medium">Loading content...</p>
          </div>
        ) : (
          <>
            <TabsContent value="patterns" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  onClick={() => handleOpenSheet()}
                  className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#5C9952] hover:bg-[#5C9952]/5 transition-all cursor-pointer group min-h-[300px] bg-white/20 backdrop-blur-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-[#5C9952]" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-bold">Add Pattern Block</p>
                    <p className="text-gray-500 text-xs mt-1">Create a new impact insight</p>
                  </div>
                </div>

                {patterns.map((pattern) => (
                  <div key={pattern.id} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm transition-all duration-300 group relative flex flex-col h-full hover:shadow-xl hover:border-[#5C9952]/20">
                    <div className="flex justify-between items-start mb-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${pattern.color}15`, color: pattern.color }}
                      >
                         <Settings2 className="h-5 w-5" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg bg-gray-50 text-gray-400 hover:text-[#5C9952] hover:bg-[#5C9952]/10 transition-all"
                          onClick={() => handleOpenSheet(pattern)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg bg-red-50 text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all"
                          onClick={() => setItemToDelete(pattern)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-xl mb-3 leading-tight group-hover:text-[#5C9952] transition-colors font-serif">{pattern.title}</h3>
                    <p className="text-gray-500 text-sm font-light line-clamp-4 mb-6 leading-relaxed flex-grow">
                      {pattern.description}
                    </p>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                       <span className="text-[10px] font-black text-[#5C9952] uppercase tracking-[0.2em] bg-[#5C9952]/5 px-3 py-1.5 rounded-full">
                         Order: {pattern.order}
                       </span>
                       <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pattern.color }} />
                         <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{pattern.color}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  onClick={() => handleOpenSheet()}
                  className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[#5C9952] hover:bg-[#5C9952]/5 transition-all cursor-pointer group min-h-[300px] bg-white/20 backdrop-blur-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-[#5C9952]" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-bold">Add Research Report</p>
                    <p className="text-gray-500 text-xs mt-1">Publish a new document or link</p>
                  </div>
                </div>

                {reports.map((report) => (
                  <div key={report.id} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm transition-all duration-300 group relative flex flex-col h-full hover:shadow-xl hover:border-[#5C9952]/20">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                         <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg bg-gray-50 text-gray-400 hover:text-[#5C9952] hover:bg-[#5C9952]/10 transition-all"
                          onClick={() => handleOpenSheet(report)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg bg-red-50 text-gray-400 hover:text-red-500 hover:bg-red-100 transition-all"
                          onClick={() => setItemToDelete(report)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-xl mb-3 leading-tight group-hover:text-[#5C9952] transition-colors font-serif">{report.title}</h3>
                    <p className="text-gray-500 text-sm font-light line-clamp-3 mb-6 leading-relaxed flex-grow">
                      {report.description || "No description provided."}
                    </p>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-3">
                       <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 truncate">
                         {report.fileUrl || report.link || "No link/file"}
                       </div>
                       <div className="flex items-center justify-between">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${report.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                           {report.published ? 'Published' : 'Draft'}
                         </span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>


      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="responsive-right" className="p-0 border-none shadow-2xl bg-white flex flex-col h-full tap-dark overflow-hidden">
          <div className="flex flex-col h-full bg-gray-50/30">
            <SheetHeader className="p-8 pb-6 bg-white border-b border-gray-100">
              <SheetTitle className="text-3xl font-black text-[#2D4A29] font-serif">
                {editingItem ? `Edit ${activeTab === 'patterns' ? 'Pattern' : 'Report'}` : `Create New ${activeTab === 'patterns' ? 'Pattern' : 'Report'}`}
              </SheetTitle>
              <SheetDescription className="text-sm font-medium text-gray-500 mt-2">
                Manage the content that appears on the public Impact page.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-8 styled-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                {activeTab === "patterns" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Title</Label>
                      <Input
                        value={patternData.title}
                        onChange={(e) => setPatternData({ ...patternData, title: e.target.value })}
                        placeholder="e.g., School Communication"
                        className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Description</Label>
                      <Textarea
                        value={patternData.description}
                        onChange={(e) => setPatternData({ ...patternData, description: e.target.value })}
                        placeholder="Detail the impact insight..."
                        className="rounded-xl border-gray-200 focus:ring-[#5C9952] min-h-[150px]"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Icon Name</Label>
                        <Input
                          value={patternData.icon}
                          onChange={(e) => setPatternData({ ...patternData, icon: e.target.value })}
                          placeholder="e.g. MessageSquare"
                          className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Theme Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={patternData.color}
                            onChange={(e) => setPatternData({ ...patternData, color: e.target.value })}
                            className="w-14 h-14 p-1 rounded-xl border-gray-200 cursor-pointer"
                          />
                          <Input
                            value={patternData.color}
                            onChange={(e) => setPatternData({ ...patternData, color: e.target.value })}
                            className="flex-1 rounded-xl h-14 border-gray-200 focus:ring-[#5C9952]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Display Order</Label>
                      <Input
                        type="number"
                        value={patternData.order}
                        onChange={(e) => setPatternData({ ...patternData, order: parseInt(e.target.value) })}
                        className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Report Title</Label>
                      <Input
                        value={reportData.title}
                        onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                        placeholder="e.g., UK SEND Advocacy Report 2024"
                        className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Summary</Label>
                      <Textarea
                        value={reportData.description}
                        onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                        placeholder="Brief summary of the report..."
                        className="rounded-xl border-gray-200 focus:ring-[#5C9952] min-h-[100px]"
                      />
                    </div>
                    <div className="grid gap-3 p-4 bg-white/50 rounded-2xl border border-gray-100 mb-2">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Resource File (Download Link)</Label>
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
                                    accept="application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,.pdf,.xlsx,.xls,.csv"
                                    onUploadComplete={(url) => {
                                        setReportData({ ...reportData, fileUrl: url });
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={reportData.fileUrl}
                                        onChange={(e) => setReportData({ ...reportData, fileUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14 pl-10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-700 uppercase tracking-widest">External Link (Optional Alternative)</Label>
                      <Input
                        value={reportData.link}
                        onChange={(e) => setReportData({ ...reportData, link: e.target.value })}
                        placeholder="https://..."
                        className="rounded-xl py-6 border-gray-200 focus:ring-[#5C9952] h-14"
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <input 
                        type="checkbox" 
                        id="published"
                        checked={reportData.published}
                        onChange={(e) => setReportData({ ...reportData, published: e.target.checked })}
                        className="w-5 h-5 rounded-md text-[#5C9952] focus:ring-[#5C9952]"
                      />
                      <Label htmlFor="published" className="font-bold text-gray-900 cursor-pointer text-base">Visible to Public</Label>
                    </div>
                  </>
                )}

                <div className="fixed bottom-0 right-0 left-0 p-8 pt-0 bg-white/80 backdrop-blur-md md:static md:p-0 md:bg-transparent">
                  <div className="flex gap-3 pt-6 border-t border-gray-100 md:border-none">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setSheetOpen(false)}
                      className="flex-1 h-16 rounded-2xl border border-gray-200 font-bold"
                    >
                      Discard
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-[2] bg-[#5C9952] hover:bg-[#4a7c42] text-white h-16 rounded-2xl font-black shadow-lg transition-all active:scale-95 text-lg"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          <span>{editingItem ? "Update Content" : "Save Content"}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent className="bg-white border tap-dark border-black/10 shadow-2xl rounded-[32px] p-8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-red-600 font-serif">
              Remove this content?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-base leading-relaxed mt-4">
              You are about to delete{" "}
              <span className="font-bold text-gray-900 italic">
                "{itemToDelete?.title}"
              </span>. 
              This will immediately remove it from the Impact page for all visitors. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-10">
            <AlertDialogCancel className="h-14 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-black h-14 rounded-xl shadow-lg"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
