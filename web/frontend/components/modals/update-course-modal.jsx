import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X } from "lucide-react"; // ✅ Cross icon
import { Textarea } from "../ui/textarea";

export default function UpdateCourseModal({
  isOpen,
  onClose,
  onSubmit,
  courseId,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, thumbnail: file });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  useEffect(() => {
    fetchCoursesById(courseId);
  }, [courseId]);

  const fetchCoursesById = async (courseId) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to load courses");
      }
      const data = await response.json();
      const apiData = data?.data;
      setPreview(apiData?.thumbnail);
      setFormData({
        title: apiData?.title,
        description: apiData?.description,
        price: apiData?.price,
        thumbnail: apiData?.thumbnail,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("price", formData.price);
    form.append("thumbnail", formData.thumbnail);

    await onSubmit(form);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Course Title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="Price"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Course Thumbnail (Image File)</Label>
              {!preview && (
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required={!preview}
            />)}
            {preview && (
              <div className="relative mt-2 w-fit">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-24 rounded border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setFormData({ ...formData, thumbnail: null });
                    document.getElementById("thumbnail").value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-900"
            >
              {loading ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
