"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { X } from "lucide-react";

export default function UpdateLessonModal({
  isOpen,
  onClose,
  onSubmit,
  editLessonData,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    order: "",
    duration: "",
    videoFile: null,
    file: null,
    thumbnail: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editLessonData) {
      setFormData({
        title: editLessonData.title || "",
        description: editLessonData.description || "",
        content: editLessonData.content || "",
        order: editLessonData.order || "0",
        duration: editLessonData.duration || "",
        videoFile: editLessonData.videoUrl || null,
        file: editLessonData.files?.[0] || null,
        thumbnail: editLessonData.thumbnail || null,
      });
    }
  }, [editLessonData]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await onSubmit(formData); // Wait for success/failure

      if (success) {
        setFormData({
          title: "",
          description: "",
          content: "",
          order: "0",
          duration: "",
          videoFile: null,
          file: null,
          thumbnail: null,
        });
        setLoading(false);
        onClose(); // Close modal
      } else {
        // Submission failed, keep modal open, maybe show error
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error("Submission failed:", error);
    }
  };


  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const videoElement = document.createElement("video");
    videoElement.preload = "metadata";

    videoElement.onloadedmetadata = function () {
      window.URL.revokeObjectURL(videoElement.src);
      const totalSeconds = Math.floor(videoElement.duration);

      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      const formatted =
        `${mins.toString().padStart(2, "0")}:` +
        `${secs.toString().padStart(2, "0")}`;

      setFormData((prev) => ({
        ...prev,
        duration: formatted,
        videoFile: file,
      }));
    };

    videoElement.src = URL.createObjectURL(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle className="font-bold text-2xl mb-4">
            Update Lesson
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Order */}
          <div className="flex gap-4">
            <div className="w-full">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="w-full">
              <Label>Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: e.target.value })
                }
                min={0}
                required
              />
            </div>
          </div>

          {/* Description & Content */}
          <div className="flex gap-4">
            <div className="w-full">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="w-full">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          {/* File & Video Upload */}
          <div className="flex gap-4">
            <div className="w-full">
              <Label>Lesson File (PDF/TXT/DOC)</Label>
              {!formData.file && (
              <Input
                type="file"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    file: e.target.files?.[0] || null,
                  })
                }
              />)}
              {formData.file && (
                <div className="relative inline-block mt-2">
                  <p className="text-sm text-gray-600">
                    {formData.file.name || formData.file.url}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, file: null })
                    }
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full">
                    <div className="flex-col flex">
              <Label className="w-100" htmlFor="video-upload">Video Upload (MP4, MOV)</Label>
              {!formData.videoFile && (
                <>
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition inline-block mt-1"
                  >
                    Choose Video
                  </label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/mp4,video/quicktime"
                    className="hidden"
                    onChange={(e) => handleVideoUpload(e)}
                  />
                </>
              )}

              {formData.videoFile && (
                <div className="relative inline-block mt-2">
                  <video
                    width="180"
                    height="100"
                    controls
                    className="rounded"
                    src={
                      typeof formData.videoFile === "string"
                        ? formData.videoFile
                        : URL.createObjectURL(formData.videoFile)
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, videoFile: null })
                    }
                    className="absolute top-0 left-[50%] -mt-2 -mr-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="w-full">
                                <div className="flex-col flex w-100">

            <Label htmlFor="thumbnail-upload">Thumbnail (Image)</Label>

            {!formData.thumbnail && (
              <>
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition inline-block mt-1"
                >
                  Choose Image
                </label>
                <Input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thumbnail: e.target.files?.[0] || null,
                    })
                  }
                />
              </>
            )}

            {formData.thumbnail && (
              <div className="relative inline-block mt-2 w-100">
                <img
                  src={
                    typeof formData.thumbnail === "string"
                      ? formData.thumbnail
                      : URL.createObjectURL(formData.thumbnail)
                  }
                  alt="Thumbnail"
                  className="w-30 h-30 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, thumbnail: null })
                  }
                  className="absolute top-0 left-[35%] -mt-2 -mr-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                >
                  <X size={16} className="text-red-500" />
                </button>
              </div>
            )}
            </div>
            <div className="flex-col flex">        <Label htmlFor="thumbnail-upload"></Label></div>
          </div>

          {/* Submit & Cancel */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              className="cursor-pointer"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-white cursor-pointer bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Saving..." : "Update Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
