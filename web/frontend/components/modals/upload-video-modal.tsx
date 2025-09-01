"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle } from "lucide-react"

interface UploadVideoModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (videoUrl: string) => void
  lessonTitle: string
}

export default function UploadVideoModal({ isOpen, onClose, onUpload, lessonTitle }: UploadVideoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          setUploadComplete(true)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval)
      setUploading(false)
      setUploadComplete(true)
      setProgress(100)

      // Generate fake video URL
      const videoUrl = `https://example.com/videos/${Date.now()}-${file.name}`

      // Wait a moment to show completion
      setTimeout(() => {
        onUpload(videoUrl)

        // Reset form
        setFile(null)
        setProgress(0)
        setUploadComplete(false)
      }, 1000)
    }, 3000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Lesson: {lessonTitle}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoFile">Video File</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                id="videoFile"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading || uploadComplete}
              />
              <label
                htmlFor="videoFile"
                className={`cursor-pointer ${uploading || uploadComplete ? "pointer-events-none" : ""}`}
              >
                <div className="flex flex-col items-center">
                  {uploadComplete ? (
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                  ) : (
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  )}
                  <p className="text-sm font-medium">{file ? file.name : "Drag and drop video, or click to browse"}</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI up to 2GB</p>
                </div>
              </label>
            </div>
          </div>

          {(uploading || uploadComplete) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Upload Progress</Label>
                <span className="text-sm">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {uploadComplete && <p className="text-sm text-green-600">Upload complete!</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || uploading || uploadComplete}>
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Upload Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
