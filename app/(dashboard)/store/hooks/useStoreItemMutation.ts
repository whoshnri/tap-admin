import { useState } from "react";
import { toast } from "sonner";
import { addItem, updateItem } from "@/app/actions/adminOps";
import { StoreItemFormData } from "../components/schema";
import { Session } from "../../AuthContext";

export function useStoreItemMutation(session: Session | null, onSuccess: () => void) {
  const [isPending, setIsPending] = useState(false);

  const add = async (data: StoreItemFormData) => {
    if (!session) return;
    setIsPending(true);
    try {
      const success = await addItem(
        data.name,
        data.desc,
        data.price,
        data.imageUrl,
        data.beaconLink ?? null,
        data.downloadLink ?? "",
        data.badge ?? "",
        data.goodFor ?? "",
        data.cta ?? "Buy Now",
        data.category,
        session,
        data.bundleId
      );
      if (success) {
        toast.success("Item added successfully");
        onSuccess();
      } else {
        toast.error("Failed to add item. Check server logs for details.");
      }
    } catch (error) {
      toast.error("An error occurred while adding the item.");
    } finally {
      setIsPending(false);
    }
  };

  const update = async (id: number, data: StoreItemFormData) => {
    if (!session) return;
    setIsPending(true);
    try {
      const success = await updateItem(
        id,
        data.name,
        data.desc,
        data.price,
        data.imageUrl,
        data.beaconLink ?? null,
        data.downloadLink ?? "",
        data.badge ?? "",
        data.goodFor ?? "",
        data.cta ?? "Buy Now",
        data.category,
        session,
        data.bundleId
      );
      if (success) {
        toast.success("Item updated successfully");
        onSuccess();
      } else {
        toast.error("Failed to update item. Check server logs for details.");
      }
    } catch (error) {
      toast.error("An error occurred while updating the item.");
    } finally {
      setIsPending(false);
    }
  };

  return { add, update, isPending };
}
