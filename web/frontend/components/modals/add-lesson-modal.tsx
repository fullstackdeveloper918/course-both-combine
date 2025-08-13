"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { X } from "lucide-react";

export default function AddLessonModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    order: "1",
    duration: "",
    videoFile: null,
    file: null,
    thumbnail: null,
  });

  const [loading, setLoading] = useState(false);

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

      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      const formatted =
        // `${hrs.toString().padStart(2, "0")}:` +
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
  console.log(formData, "here to see");

  const handleClose = () => {
  setFormData({
    title: "",
    description: "",
    content: "",
    order: "1",
    duration: "",
    videoFile: null,
    file: null,
    thumbnail: null,
  });
  onClose();
};
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent   onInteractOutside={(e) => e.preventDefault()}
 className="bg-white sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle style={{fontWeight:"700", fontSize:"26px", marginBottom:"15px"}}>Add Lesson</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{ display: "flex", gap: "10px", flexDirection: "row" }}>
            <div className="w-100">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="w-100">
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

          <div style={{ display: "flex", gap: "10px", flexDirection: "row" }}>
            <div className="w-100">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="w-100">
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
          <div className="flex gap-4">
             <div className="w-100">
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
                               className="absolute top-0 -right-4 -mt-2 -mr-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                             >
                               <X size={16} className="text-red-500" />
                             </button>
                           </div>
                         )}
            </div>

            <div className="w-100">
                                  <div className="flex-col flex">

              <Label htmlFor="video-upload">Video Upload (MP4, MOV)</Label>
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
          <div style={{ display: "flex", gap: "10px", flexDirection: "row" }}>
             {/* <div className="w-100">
              <Label>Duration</Label>
              <Input
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder="e.g., 10:30"
              />
            </div> */}
         

            <div className="w-100">
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
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" className="cursor-pointer" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-white cursor-pointer bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Saving..." : "Create Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
