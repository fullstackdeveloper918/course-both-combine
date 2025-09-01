"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const [uploadType, setUploadType] = useState("videos")
  const [courseId, setCourseId] = useState("")
  const [moduleTitle, setModuleTitle] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate
    if (!files || files.length === 0) {
      setError("Please select files to upload")
      setLoading(false)
      return
    }

    if (!courseId) {
      setError("Please select a course")
      setLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      // Success
      setLoading(false)
      onClose()

      // Reset form
      setFiles(null)
      setCourseId("")
      setModuleTitle("")
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="uploadType">Upload Type</Label>
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger>
                <SelectValue placeholder="Select upload type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="videos">Videos</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="csv">CSV Import</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseId">Select Course</Label>
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

          {uploadType === "videos" && (
            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Module Title (Optional)</Label>
              <Input
                id="moduleTitle"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="e.g. Introduction to HTML"
              />
              <p className="text-xs text-gray-500">If provided, all videos will be added to this module</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="files">Upload Files</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                id="files"
                type="file"
                multiple={true}
                accept={
                  uploadType === "videos"
                    ? "video/*"
                    : uploadType === "documents"
                      ? ".pdf,.doc,.docx,.ppt,.pptx"
                      : ".csv"
                }
                className="hidden"
                onChange={(e) => setFiles(e.target.files)}
              />
              <label htmlFor="files" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  {uploadType === "csv" ? (
                    <FileText className="h-10 w-10 text-gray-400 mb-2" />
                  ) : (
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  )}
                  <p className="text-sm font-medium">
                    {files && files.length > 0
                      ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                      : `Drag and drop ${uploadType}, or click to browse`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadType === "videos"
                      ? "MP4, MOV, AVI up to 2GB each"
                      : uploadType === "documents"
                        ? "PDF, DOC, DOCX, PPT, PPTX up to 50MB each"
                        : "CSV file with course data"}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
