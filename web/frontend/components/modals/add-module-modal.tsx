"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea" // Make sure you have this component



export default function AddModuleModal({ isOpen, onClose, onSubmit, editingModule }) {
  const [formData, setFormData] = useState({
    title: editingModule?.title || "",
    description: editingModule?.description || "",
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
      <DialogContent    onInteractOutside={(e) => e.preventDefault()} className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingModule ? "Edit Module" : "Add New Module"}</DialogTitle>
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
              {loading ? "Updating..."  : "Create Module"}  
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
