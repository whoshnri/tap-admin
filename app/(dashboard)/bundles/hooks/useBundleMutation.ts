import { useTransition } from "react";
import { toast } from "sonner";
import { addBundle, updateBundle, toggleItemInBundle } from "@/app/actions/adminOps";
import { BundleFormData } from "../components/bundleSchema";
import type { StoreItem } from "@/app/generated/prisma/browser";

interface BundleWithItems {
  id: number;
  items: StoreItem[];
}

export function useBundleMutation(
  bundleToEdit: BundleWithItems | null,
  session: any,
  onSuccess: () => void
) {
  const [isPending, startTransition] = useTransition();

  const mutate = async (data: BundleFormData) => {
    if (!session) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    startTransition(async () => {
      try {
        const { assignedItemIds, ...bundleData } = data;

        if (bundleToEdit) {
          // --- UPDATE FLOW ---
          const success = await updateBundle(
            bundleToEdit.id,
            bundleData.name,
            bundleData.desc,
            bundleData.price,
            bundleData.imageUrl,
            bundleData.category,
            bundleData.badge || "",
            bundleData.cta || "",
            bundleData.includes,
            bundleData.total,
            session
          );

          if (!success) {
            toast.error("Failed to update bundle. Please try again.");
            return;
          }

          // Sync item assignments — diff current vs desired
          const currentIds = bundleToEdit.items.map((i) => i.id);
          const toAdd = assignedItemIds.filter((id) => !currentIds.includes(id));
          const toRemove = currentIds.filter((id) => !assignedItemIds.includes(id));

          await Promise.all([
            ...toAdd.map((id) => toggleItemInBundle(id, bundleToEdit.id, session)),
            ...toRemove.map((id) => toggleItemInBundle(id, null, session)),
          ]);

          toast.success("Bundle updated successfully");
        } else {
          // --- CREATE FLOW ---
          const newBundleId = await addBundle(
            bundleData.name,
            bundleData.desc,
            bundleData.price,
            bundleData.imageUrl,
            bundleData.category,
            bundleData.badge || "",
            bundleData.cta || "",
            bundleData.includes,
            bundleData.total,
            session
          );

          if (!newBundleId) {
            toast.error("Failed to create bundle. Please try again.");
            return;
          }

          // Assign all selected items to the new bundle
          if (assignedItemIds.length > 0) {
            await Promise.all(
              assignedItemIds.map((id) => toggleItemInBundle(id, newBundleId, session))
            );
          }

          toast.success("Bundle created successfully");
        }

        onSuccess();
      } catch (error) {
        console.error("Mutation error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  return { mutate, isPending };
}
