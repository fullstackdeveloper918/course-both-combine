"use client";

import React, { useState, useEffect } from "react";
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
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "../../components/ui/progress";

// File validation utilities matching backend multer configuration
const validateThumbnail = (
  file: File
): { isValid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  const maxSize = 2048 * 1024 * 1024; // 2GB (matching backend)

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid thumbnail format. Only JPG, PNG, GIF are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Thumbnail file too large. Maximum size is ${
        maxSize / (1024 * 1024)
      }MB.`,
    };
  }

  return { isValid: true };
};

const validateSupportingFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain", // .txt
  ];

  // Also allow any image type for supporting files
  const isImage = file.type.startsWith("image/");
  const maxSize = 2048 * 1024 * 1024; // 2GB (matching backend)

  if (!allowedTypes.includes(file.type) && !isImage) {
    return {
      isValid: false,
      error:
        "Invalid file type. Only PDF, DOC, DOCX, TXT, and image files are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
    };
  }

  return { isValid: true };
};

const validateSupportingFiles = (
  files: FileList
): { isValid: boolean; error?: string } => {
  if (files.length > 5) {
    return {
      isValid: false,
      error: "Maximum 5 supporting files allowed.",
    };
  }

  for (let i = 0; i < files.length; i++) {
    const validation = validateSupportingFile(files[i]);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
};

const validateVideoFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const allowedTypes = ["video/mp4"];
  const maxSize = 2048 * 1024 * 1024; // 2GB (matching backend)

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid video format. Only MP4 is allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Video file too large. Maximum size is ${
        maxSize / (1024 * 1024)
      }MB.`,
    };
  }

  return { isValid: true };
};

// Direct upload utility for Bunny CDN
const uploadToBunnyDirect = async (
  file: File,
  uploadUrl: string,
  headers: Record<string, string>,
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percentage: number;
  }) => void
) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"));
    });

    xhr.open("PUT", uploadUrl);

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.send(file);
  });
};

interface FormData {
  title: string;
  description: string;
  content: string;
  order: string;
  duration: string;
  videoFile: File | null;
  files: File[];
  thumbnail: File | null;
}

interface UploadState {
  status: "idle" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  videoGuid: string | null;
  error: string | null;
  processingProgress?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void>;
  courseId: string;
  moduleId: string;
}

export default function AddLessonModalTus({
  isOpen,
  onClose,
  onSubmit,
  courseId,
  moduleId,
}: Props) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    content: "",
    order: "1",
    duration: "",
    videoFile: null,
    files: [],
    thumbnail: null,
  });

  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    videoGuid: null,
    error: null,
  });

  const [lessonCreationState, setLessonCreationState] = useState({
    status: "idle", // 'idle', 'creating', 'completed', 'error'
    progress: 0,
    error: null,
  });

  const [loading, setLoading] = useState(false);

  // Persist form data to localStorage
  const STORAGE_KEY = `lesson_form_${courseId}_${moduleId}`;

  useEffect(() => {
    // Load saved form data and upload state on mount
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedUploadState = localStorage.getItem(`${STORAGE_KEY}_upload`);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load saved form data:", error);
      }
    }

    if (savedUploadState) {
      try {
        const parsedUpload = JSON.parse(savedUploadState);
        setUploadState(parsedUpload);

        // If video was uploaded but lesson not created, keep the completed status
        if (parsedUpload.videoGuid && parsedUpload.status === "completed") {
          // Video upload is complete, user can proceed with lesson creation
        }
      } catch (error) {
        console.error("Failed to load saved upload state:", error);
      }
    }
  }, [STORAGE_KEY]);

  useEffect(() => {
    // Save form data to localStorage whenever it changes
    if (formData.title || formData.description || formData.content) {
      const dataToSave = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        order: formData.order,
        duration: formData.duration,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [formData, STORAGE_KEY]);

  useEffect(() => {
    // Save upload state to localStorage
    if (uploadState.videoGuid || uploadState.status !== "idle") {
      localStorage.setItem(
        `${STORAGE_KEY}_upload`,
        JSON.stringify(uploadState)
      );
    }
  }, [uploadState, STORAGE_KEY]);

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_upload`);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate video file using backend validation rules
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      setUploadState((prev) => ({
        ...prev,
        error: validation.error || "Invalid video file",
      }));
      return;
    }

    // Store the file for later upload
    setFormData((prev) => ({ ...prev, videoFile: file }));
    setUploadState({
      status: "idle",
      progress: 0,
      videoGuid: null,
      error: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Start lesson creation progress
    setLessonCreationState({
      status: "creating",
      progress: 10,
      error: null,
    });

    try {
      let videoGuid = null;

      // Only upload video if a video file is provided
      if (formData.videoFile) {
        // Step 1: Create Bunny upload URL
        setLessonCreationState((prev) => ({ ...prev, progress: 20 }));

        const uploadResponse = await fetch(
          "/api/lessons/createBunnyTusUpload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              courseId,
              moduleId,
            }),
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to create upload URL");
        }

        const uploadData = await uploadResponse.json();
        const { uploadUrl, streamApiKey, videoGuid: newVideoGuid } = uploadData;
        videoGuid = newVideoGuid;

        // Step 2: Upload video to Bunny CDN
        setLessonCreationState((prev) => ({ ...prev, progress: 30 }));
        setUploadState({
          status: "uploading",
          progress: 0,
          videoGuid: null,
          error: null,
        });

        await uploadToBunnyDirect(
          formData.videoFile,
          uploadUrl,
          {
            AccessKey: streamApiKey,
            "Content-Type": formData.videoFile.type,
          },
          (progress) => {
            setUploadState((prev) => ({
              ...prev,
              progress: progress.percentage,
            }));
            // Update lesson creation progress based on upload progress
            const lessonProgress = 30 + progress.percentage * 0.4; // 30% to 70%
            setLessonCreationState((prev) => ({
              ...prev,
              progress: Math.round(lessonProgress),
            }));
          }
        );

        setUploadState({
          status: "completed",
          progress: 100,
          videoGuid,
          error: null,
        });
      } else {
        // No video file, skip upload and go directly to lesson creation
        setLessonCreationState((prev) => ({ ...prev, progress: 50 }));
      }

      // Step 3: Create lesson (with or without video GUID)
      setLessonCreationState((prev) => ({ ...prev, progress: 80 }));

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("content", formData.content);
      submitData.append("order", formData.order);
      submitData.append("courseId", courseId);
      submitData.append("moduleId", moduleId);
      if (videoGuid) {
        submitData.append("videoGuid", videoGuid);
      }
      submitData.append("isPreview", "true");

      if (formData.thumbnail) {
        submitData.append("thumbnail", formData.thumbnail);
      }
      if (formData.files.length > 0) {
        formData.files.forEach((file, index) => {
          submitData.append("file", file);
        });
      }

      const response = await fetch("/api/lessons", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();

      if (result.success) {
        setLessonCreationState((prev) => ({
          ...prev,
          progress: 100,
          status: "completed",
        }));

        // Clear saved data on success
        clearSavedData();

        // Reset form
        setFormData({
          title: "",
          description: "",
          content: "",
          order: "1",
          duration: "",
          videoFile: null,
          files: [],
          thumbnail: null,
        });
        setUploadState({
          status: "idle",
          progress: 0,
          videoGuid: null,
          error: null,
        });
        setLessonCreationState({
          status: "idle",
          progress: 0,
          error: null,
        });

        if (onSubmit) {
          await onSubmit(result.data);
        }

        onClose();
      }
    } catch (error) {
      console.error("Error creating lesson:", error);
      setLessonCreationState({
        status: "error",
        progress: 0,
        error: error.message,
      });
      setUploadState({
        status: "error",
        progress: 0,
        videoGuid: null,
        error: error.message,
      });
    }
  };

  const handleClose = () => {
    // Don't clear saved data on close - only on successful submit
    setFormData({
      title: "",
      description: "",
      content: "",
      order: "1",
      duration: "",
      videoFile: null,
      files: [],
      thumbnail: null,
    });
    setUploadState({
      status: "idle",
      progress: 0,
      videoGuid: null,
      error: null,
    });
    onClose();
  };

  const renderUploadStatus = () => {
    switch (uploadState.status) {
      case "uploading":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 animate-spin" />
              <span className="text-sm text-blue-600">
                Uploading video... {uploadState.progress}%
              </span>
            </div>
            <Progress value={uploadState.progress} className="w-full" />
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Video uploaded successfully!</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{uploadState.error}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderLessonCreationStatus = () => {
    switch (lessonCreationState.status) {
      case "creating":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 animate-spin" />
              <span className="text-sm text-orange-600">
                Creating lesson... {lessonCreationState.progress}%
              </span>
            </div>
            <Progress value={lessonCreationState.progress} className="w-full" />
            <p className="text-xs text-gray-500">
              Please wait while your lesson is being created and video is being
              processed.
            </p>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Lesson created successfully!</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{lessonCreationState.error}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="bg-white sm:max-w-[860px]"
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontWeight: "700",
              fontSize: "26px",
              marginBottom: "15px",
            }}
          >
            Add Lesson
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-100">
              <div className="flex-col flex">
                <Label htmlFor="thumbnail-upload">Thumbnail (Optional)</Label>

                {!formData.thumbnail && (
                  <>
                    <label
                      htmlFor="thumbnail-upload"
                      className="cursor-pointer px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition inline-block mt-1"
                    >
                      Choose Image
                    </label>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const validation = validateThumbnail(file);
                        if (!validation.isValid) {
                          setUploadState((prev) => ({
                            ...prev,
                            error: validation.error || "Invalid thumbnail file",
                          }));
                          // Clear the input
                          e.target.value = "";
                          return;
                        }

                        // Clear any previous errors
                        setUploadState((prev) => ({
                          ...prev,
                          error: null,
                        }));

                        setFormData({
                          ...formData,
                          thumbnail: file,
                        });
                      }}
                    />
                  </>
                )}

                {formData.thumbnail && (
                  <div className="relative inline-block mt-2 w-100">
                    <img
                      src={URL.createObjectURL(formData.thumbnail)}
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

            <div className="w-100">
              <div className="flex-col flex">
                <Label htmlFor="file-upload">
                  Supporting Files (Optional - Max 5)
                </Label>

                {formData.files.length < 5 && (
                  <>
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition inline-block mt-1"
                    >
                      {formData.files.length === 0
                        ? "Choose Files (Max 5)"
                        : `Add More Files (${formData.files.length}/5)`}
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;

                        // Check if adding these files would exceed the limit
                        const totalFiles = formData.files.length + files.length;
                        if (totalFiles > 5) {
                          setUploadState((prev) => ({
                            ...prev,
                            error: `Cannot add ${files.length} files. Maximum 5 files allowed (currently have ${formData.files.length}).`,
                          }));
                          e.target.value = "";
                          return;
                        }

                        const validation = validateSupportingFiles(files);
                        if (!validation.isValid) {
                          setUploadState((prev) => ({
                            ...prev,
                            error:
                              validation.error || "Invalid supporting files",
                          }));
                          // Clear the input
                          e.target.value = "";
                          return;
                        }

                        // Clear any previous errors
                        setUploadState((prev) => ({
                          ...prev,
                          error: null,
                        }));

                        // Add new files to existing files
                        setFormData({
                          ...formData,
                          files: [...formData.files, ...Array.from(files)],
                        });

                        // Clear the input for next selection
                        e.target.value = "";
                      }}
                    />
                  </>
                )}

                {formData.files.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.files.map((file, index) => (
                      <div key={index} className="relative inline-block">
                        <p className="text-sm text-gray-600">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = formData.files.filter(
                              (_, i) => i !== index
                            );
                            setFormData({ ...formData, files: newFiles });
                          }}
                          className="absolute top-0 -right-4 -mt-2 -mr-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-100">
              <div className="flex-col flex">
                <Label htmlFor="video-upload">
                  Video Upload (MP4) - Optional
                </Label>

                {uploadState.status === "idle" && !formData.videoFile && (
                  <>
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition inline-block mt-1"
                    >
                      Choose Video
                    </label>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </>
                )}

                {/* Upload Status */}
                {renderUploadStatus()}

                {formData.videoFile && (
                  <div className="relative inline-block mt-2">
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formData.videoFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.videoFile.size / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, videoFile: null });
                          setUploadState({
                            status: "idle",
                            progress: 0,
                            videoGuid: null,
                            error: null,
                          });
                        }}
                        className="bg-white rounded-full p-1 shadow hover:bg-red-100"
                      >
                        <X size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Display lesson creation status */}
          {renderLessonCreationStatus()}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              className="cursor-pointer"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                uploadState.status === "uploading" ||
                lessonCreationState.status === "creating" ||
                !formData.title
              }
              className="text-white cursor-pointer bg-purple-600 hover:bg-purple-700"
            >
              {lessonCreationState.status === "creating"
                ? "Creating Lesson..."
                : uploadState.status === "uploading"
                ? "Uploading..."
                : "Create Lesson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
