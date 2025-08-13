"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnrollCourseModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EnrollCourseModal({ isOpen, onClose }: EnrollCourseModalProps) {
  const [studentEmail, setStudentEmail] = useState("")
  const [courseId, setCourseId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      onClose()

      // Reset form
      setStudentEmail("")
      setCourseId("")
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentEmail">Student Email</Label>
            <Input
              id="studentEmail"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="student@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Complete Web Development Bootcamp</SelectItem>
                <SelectItem value="2">Digital Marketing Mastery</SelectItem>
                <SelectItem value="3">Python Programming for Beginners</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !studentEmail || !courseId}>
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
              Enroll Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
