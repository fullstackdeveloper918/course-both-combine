"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea" // Make sure you have this component



export default function UpdateModuleModal({ isOpen, onClose, onSubmit, editmodule, moduleId }) {
  const [formData, setFormData] = useState({
    title: editmodule?.title || "",
    description: editmodule?.description || "",
  })  
  const [loading, setLoading] = useState(false);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onSubmit(formData)

    setTimeout(()=>{
              setLoading(false);

              setFormData({ title: "", description: "" }) // Reset form
              onClose()
            },1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editmodule ? "Edit Module" : "Add New Module"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Module Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter module title"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter module description"
              rows={3}
            />
          </div>
          <DialogFooter className="flex justify-end space-x-2">
            <Button type="button" className="text-black" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              {loading ? "Updating..." : <>   {editmodule ? "Update" : "Create"} Module </>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
