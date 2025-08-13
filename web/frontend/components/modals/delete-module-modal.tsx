"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteModuleModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  moduleName: string
}

export default function DeleteModuleModal({ isOpen, onClose, onDelete, moduleName }: DeleteModuleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Module</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{moduleName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500">Deleting this module will remove all associated lessons and content.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
