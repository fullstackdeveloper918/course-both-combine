import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
} from "lucide-react";

import CreateCourseModal from "../components/modals/create-course-modal";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import AddModuleModal from "../components/modals/add-module-modal";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import UpdateCourseModal from "../components/modals/update-course-modal";

export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCourseId, setDeleteCourseId] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleModalEdit, setModuleModalEdit] = useState(false);
  const [loadingDelete,setLoadingDelete]= useState()
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  console.log(moduleModal, "moduleModal");

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      console.log(response, "fetch course response");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to load courses");
      }
      const data = await response.json();
      console.log(data, "fetch course data");
      setCourses(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (formData) => {
    const response = await fetch("/api/courses", {
      method: "POST",
      body: formData, // No need to set headers
    });

    if (response.ok) {
      fetchCourses();
      setIsCreateModalOpen(false);
    } else {
      console.error("Failed to create course");
    }
  };

  const handleEditCourse = (course) => {
    console.log(course);
    setEditCourse(course);
    setIsEditModalOpen(true);
  };

  const handleUpdateCourse = async (courseData) => {
    try {
      const response = await fetch(`/api/courses/${editCourse}`, {
        method: "PUT",
        body: courseData,
      });
      if (response.ok) {
        fetchCourses();
        setIsEditModalOpen(false);
      } else {
        console.error("Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
    }
  };

  const handleDeleteCourse = (id) => {
    setDeleteCourseId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCourse = async () => {
    setLoadingDelete(true);
    try {
      const response = await fetch(`/api/courses/${deleteCourseId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchCourses();
        setIsDeleteModalOpen(false);
        setLoadingDelete(false);
      } else {
        setLoadingDelete(false);

        console.error("Failed to delete course");
      }
    } catch (error) {
      setLoadingDelete(false);

      console.error("Error deleting course:", error);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkError(null);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const response = await fetch("/api/courses/bulkupload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchCourses();
        setIsBulkModalOpen(false);
        setBulkFile(null);
      } else {
        setBulkError("Failed to upload CSV");
      }
    } catch (error) {
      setBulkError(error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  console.log(filteredCourses, "filteredCourses");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          {error.includes("Authentication") && (
            <p className="mt-4 text-sm text-gray-500">
              Your session may have expired. Please try refreshing the page or
              navigating back to your Shopify home.
            </p>
          )}
        </div>
      </div>
    );
  }

  console.log(isCreateModalOpen, "isCreateModalOpen");

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full  px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Course Manager
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your courses and their content
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Course
            </motion.button>
            {/* <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition-colors ml-4"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Bulk Upload
            </motion.button> */}
          </div>
        </div>
      </div>

      <div className="w-full  px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <Card
              key={course.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start flex-col">
                  <div className="flex justify-between w-full mb-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </CardTitle>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        text-gray-600
                        line-clamp-2
                        mb-4
                        size="sm"
                        className="cursor-pointer"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course?.id);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>{" "}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-5 w-full mb-4">
                    {course.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {course.thumbnail && (
                  <img
                    src={course.thumbnail || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-md mb-3"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/placeholder.svg?height=128&width=256";
                    }}
                  />
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {course.moduleCount} modules
                  </span>
                  <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
                <Button
                  className="w-full text-[#fff] bg-purple-600 hover:bg-purple-700"
                  onClick={() => navigate(`/modules-manager?id=${course.id}`)}
                >
                  Manage Modules
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {moduleModal && (
        <AddModuleModal
          isOpen={moduleModal}
          onClose={() => setModuleModal(false)}
        />
      )}

      {isCreateModalOpen && (
        <CreateCourseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCourse}
        ></CreateCourseModal>
      )}

      {isEditModalOpen && (
        <UpdateCourseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateCourse}
          courseId={editCourse}
        />
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 transition-transform scale-100">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Delete Course?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mb-6">
              Are you sure you want to delete this course? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 cursor-pointer rounded-lg text-zinc-700 dark:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button disabled={loadingDelete}
                onClick={confirmDeleteCourse}
                className="px-4 py-2 cursor-pointer rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
              >
             {loadingDelete ? "Loading..." : "Delete"}   
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <form
            className="bg-white p-6 rounded-lg shadow-lg"
            onSubmit={handleBulkUpload}
          >
            <h2 className="text-lg font-semibold mb-4">
              Bulk Upload Courses (CSV)
            </h2>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
              required
            />
            {bulkError && <div className="text-red-600 mt-2">{bulkError}</div>}
            <div className="flex gap-4 mt-6">
              <button
                className="bg-gray-200 px-4 py-2 rounded"
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                type="submit"
                disabled={bulkLoading}
              >
                {bulkLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
