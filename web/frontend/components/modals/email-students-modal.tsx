"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface EmailStudentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function EmailStudentsModal({ isOpen, onClose }: EmailStudentsModalProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [recipients, setRecipients] = useState("all")
  const [courseFilter, setCourseFilter] = useState("")
  const [includeProgress, setIncludeProgress] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      onClose()

      // Reset form
      setSubject("")
      setMessage("")
      setRecipients("all")
      setCourseFilter("")
      setIncludeProgress(false)
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Email Students</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <Select value={recipients} onValueChange={setRecipients}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="course">Students in Specific Course</SelectItem>
                <SelectItem value="active">Active Students Only</SelectItem>
                <SelectItem value="inactive">Inactive Students Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipients === "course" && (
            <div className="space-y-2">
              <Label htmlFor="courseFilter">Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message to students..."
              rows={6}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeProgress"
              checked={includeProgress}
              onCheckedChange={(checked) => setIncludeProgress(checked as boolean)}
            />
            <Label htmlFor="includeProgress" className="text-sm">
              Include course progress in email
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !subject || !message}>
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
              Send Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
