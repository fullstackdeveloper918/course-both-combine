import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"

export default function CreateCourseModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: null, // Will hold the file object
  })
  const [preview, setPreview] = useState(null)
   const [loading,setLoading] = useState(false)
 const handleFileChange = (e) => {
  const file = e.target.files[0]
  setFormData({ ...formData, thumbnail: file })

  if (file) {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  } else {
    setPreview(null)
  }
}


const handleSubmit = async (e) => {
  e.preventDefault()
setLoading(true)
  const form = new FormData()
  form.append("title", formData.title)
  form.append("description", formData.description)
  form.append("price", formData.price)
  form.append("thumbnail", formData.thumbnail) // This must be the File object

  await onSubmit(form)

  setLoading(false)
}

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent    onInteractOutside={(e) => e.preventDefault()} className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Course Title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Price"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Course Thumbnail (Image File)</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {preview && (
              <img src={preview} alt="Preview" className="mt-2 h-24 rounded" />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" style={{ backgroundColor: '#000', color: '#fff', cursor: 'pointer' }} type="submit">
            {loading ? "Loading..." : "Create Course"}  
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 