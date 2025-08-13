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

interface DeleteLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  lessonName: string
}

export default function DeleteLessonModal({ isOpen, onClose, onDelete, lessonName }: DeleteLessonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Lesson</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{lessonName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500">
            Deleting this lesson will remove all associated content and student progress.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
