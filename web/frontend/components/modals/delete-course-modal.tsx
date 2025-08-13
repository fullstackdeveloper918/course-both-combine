"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog"
import { AlertTriangle } from "lucide-react"
import { Button } from "../ui/button"

interface DeleteCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  courseName: string
}

export default function DeleteCourseModal({ isOpen, onClose, onDelete, courseName }: DeleteCourseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Course</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{courseName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500">
            Deleting this course will remove all associated content, including modules, lessons, and student progress
            data.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
