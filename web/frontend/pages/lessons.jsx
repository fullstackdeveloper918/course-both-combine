import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Edit, Trash2, Play, Clock } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import AddLessonModal from "../components/modals/add-lesson-modal";
import UpdateLessonModal from "../components/modals/update-lesson-modal";

export default function LessonsPage() {
  const [lessons, setLessons] = useState([]);
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDialogEditOpen, setIsDialogEditOpen] = useState(false);

  const [addLesson, setAddLesson] = useState(null);
    const [editLesson, setEditLesson] = useState(null);
    const [editLessonId, setEditLessonId] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
  });

  const [courseId, setCourseId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [error,setError] = useState(null)
  const [loading, setLoading] = useState(null)
  const [deleteCourseId,setDeleteCourseId] = useState()
  const location = useLocation();
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get("id");
    const moduleId = params.get("moduleId");

    console.log("Course ID:", courseId);
    console.log("Module ID:", moduleId);

    setCourseId(courseId);
    setModuleId(moduleId);

     loadCourse();
    loadModule();
    loadLessons(moduleId);
  }, [location.search]);


  const loadCourse = () => {
    const savedCourses = localStorage.getItem("courses");
    if (savedCourses) {
      const courses = JSON.parse(savedCourses);
      const foundCourse = courses.find((c) => c.id === courseId);
      setCourse(foundCourse);
    }
  };

  const loadModule = () => {
    const savedModules = localStorage.getItem(`modules_${courseId}`);
    if (savedModules) {
      const modules = JSON.parse(savedModules);
      const foundModule = modules.find((m) => m.id === moduleId);
      setModule(foundModule);
    }
  };

  async function loadLessons(moduleId) {
    try {
      const response = await fetch("/api/lessons");
      console.log(response, "fetch course response");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to load courses");
      }
      const data = await response.json();
      console.log(data, "fetch course data");

        const filteredLessons = Array.isArray(data?.data?.lessons)
      ? data.data.lessons.filter(module => module.moduleId === moduleId)
      : [];

    setLessons(filteredLessons);
      // setLessons(Array.isArray(data) ? data : data.data || []);

      setError(null);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
const handleLessonSubmit = async (formDataObj) => {
  const formData = new FormData();
  formData.append("title", formDataObj.title);
  formData.append("description", formDataObj.description);
  formData.append("content", formDataObj.content);
  formData.append("order", formDataObj.order);
  formData.append("duration", formDataObj.duration);
  formData.append("courseId", courseId);
  formData.append("moduleId", moduleId);
  if (formDataObj.videoFile)
    formData.append("video", formDataObj.videoFile, formDataObj.videoFile.name);
  if (formDataObj.file)
    formData.append("file", formDataObj.file, formDataObj.file.name);
  if (formDataObj.thumbnail)
    formData.append("thumbnail", formDataObj.thumbnail, formDataObj.thumbnail.name);

  try {
    const res = await fetch("/api/lessons", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Upload failed:", err);
      return false;
    }

    const data = await res.json();
    console.log("Upload success:", data);
    await loadLessons(moduleId);
    return true;
  } catch (err) {
    console.error("Network error:", err);
    return false;
  }
};


async function handleSubmit(formData) {
  if (editLesson) {
handleLessonEditSubmit(formData)
    return true;
  } else {
    const success = await handleLessonSubmit(formData);
    return success; // ← return result to modal
  }
}


const handleLessonEditSubmit = async (formDataObj) => {
  const formData = new FormData();
  formData.append("title", formDataObj.title);
  formData.append("description", formDataObj.description);
  formData.append("content", formDataObj.content);
  formData.append("order", formDataObj.order);
  formData.append("duration", formDataObj.duration);
  formData.append("courseId", courseId);
  formData.append("moduleId", moduleId);
  if (formDataObj.videoFile)
    formData.append("video", formDataObj.videoFile, formDataObj.videoFile.name);
  if (formDataObj.file)
    formData.append("file", formDataObj.file, formDataObj.file.name);
  if (formDataObj.thumbnail)
    formData.append("thumbnail", formDataObj.thumbnail, formDataObj.thumbnail.name);

  try {
    const res = await fetch(`/api/lessons/${editLessonId}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Upload failed:", err);
      return false;
    }

    const data = await res.json();
    console.log("Upload success:", data);
    await loadLessons(moduleId);
    return true;
  } catch (err) {
    console.error("Network error:", err);
    return false;
  }
};


  const handleAddLesson = (lesson) => {
    setAddLesson(lesson);
    setIsDialogOpen(true);
  };

  console.log(editLesson?.id,"lesosnssss")
    const handleEditLesson = (lesson) => {
      setEditLessonId(lesson.id)
    setEditLesson(lesson);
    setIsDialogEditOpen(true);
  };

  const openDialog = () => {
    setAddLesson(null);
    setFormData({ title: "", description: "", videoUrl: "", duration: "" });
    setIsDialogOpen(true);
  };

  
  const handleDeleteLesson = (id) => {
    setDeleteCourseId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDeletemodule = async () => {
    try {
      const response = await fetch(`/api/lessons/${deleteCourseId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchmodules(id)
        setIsDeleteModalOpen(false)
      } else {
        console.error("Failed to delete module")
      }
    } catch (error) {
      console.error("Error deleting module:", error)
    }
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() =>navigate(`/modules-manager?id=${courseId}`)}
              className="mr-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {course?.title} - {module?.title} - Lessons
              </h1>
              <p className="text-gray-600 mt-1">
                Manage lessons and video content
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleAddLesson}
                  className=" text-[#fff] bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <Card
                key={lesson.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                          Lesson {index + 1}
                        </span>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {lesson.title}
                        </CardTitle>
                      </div>
                      <p className="text-gray-600 mb-3">{lesson.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {lesson.duration || "Duration not set"}
                        <span className="mx-2">•</span>
                        Created{" "}
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLesson(lesson)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        className="text-[#fff] bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          navigate(`/lessons-detail?id=${courseId}&moduleId=${moduleId}&lessonId=${lesson?.id}`)
                        }
                      >
                        <Play className="w-4 h-4 mr-1" />
                        View Lesson
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <AddLessonModal
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)} // ✅ PASS FUNCTION
            onSubmit={handleSubmit}
          />

          {isDialogEditOpen && <UpdateLessonModal
            isOpen={isDialogEditOpen}
          onClose={() => setIsDialogEditOpen(false)}
          onSubmit={handleSubmit}
          editLessonData={editLesson}
          />}

   {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this module?</p>
            <div className="flex gap-4 mt-6">
              <button className="bg-gray-200 px-4 py-2 cursor-pointer rounded" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="bg-red-600 text-white cursor-pointer px-4 py-2 rounded" onClick={confirmDeletemodule}>Delete</button>
            </div>
          </div>
        </div>
      )}
          {lessons.length === 0 && (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No lessons yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start adding lessons to this module
              </p>
              <Button
                onClick={openDialog}
                className="text-[#fff] bg-purple-600 mt-4 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
