"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportStudentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportStudentsModal({ isOpen, onClose }: ImportStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate
    if (!file) {
      setError("Please select a CSV file")
      setLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      onClose()

      // Reset form
      setFile(null)
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="csvFile" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium">
                    {file ? file.name : "Drag and drop CSV file, or click to browse"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV file with student data</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">CSV Format</h4>
            <p className="text-sm text-gray-600 mb-2">Your CSV file should include the following columns:</p>
            <code className="text-xs bg-white p-2 rounded block">name,email,shopify_customer_id</code>
            <p className="text-xs text-gray-500 mt-2">The shopify_customer_id column is optional</p>
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
              Import Students
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
