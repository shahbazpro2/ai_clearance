"use client";

import { useApi } from "use-hook-api";
import { deleteMediaBuyerUserApi, type MediaBuyerUser } from "@/api/mediaBuyer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertTriangle } from "lucide-react";

interface DeleteMediaBuyerUserDialogProps {
  user: MediaBuyerUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (deletedUserId: string) => void;
}

export function DeleteMediaBuyerUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeleteMediaBuyerUserDialogProps) {
  const [callDeleteUser, { loading: deletingUser }] = useApi({
    both: true,
    resSuccessMsg: "Media Buyer user deleted successfully.",
    refetchApis: ["media-buyer-users"],
  });

  const handleDelete = () => {
    if (!user) return;
    callDeleteUser(
      deleteMediaBuyerUserApi(user.id),
      () => {
        onOpenChange(false);
        onSuccess?.(user.id);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left text-lg font-semibold text-gray-900">
                Delete Media Buyer User
              </DialogTitle>
              <p className="text-left text-xs text-gray-500 mt-0.5">
                This will soft-delete the user and disable their portal access.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 text-sm text-gray-600">
          Are you sure you want to delete the media buyer user account for{" "}
          <span className="font-semibold text-gray-900">
            {user?.name ? `${user.name} (${user.email})` : user?.email}
          </span>
          ?
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={deletingUser}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deletingUser}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deletingUser ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
