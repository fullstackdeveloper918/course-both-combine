import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  ArrowLeft,
} from "lucide-react";
import AddModuleModal from "../components/modals/add-module-modal";
import { Button } from "../components/ui/button";
import { useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import UpdateModuleModal from "../components/modals/update-module-modal";

export default function moduleManager() {
  const [modules, setmodules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editmodule, setEditmodule] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletemoduleId, setDeletemoduleId] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const [moduleModal, setModuleModal] = useState(false);

  const navigate = useNavigate();

  const [id, setId] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const courseId = params.get("id");
    console.log("Query ID:", courseId); // 🧪 Verify this in the console
    setId(courseId);
    fetchmodules(courseId);
  }, [location.search]);

  console.log(moduleModal, "moduleModal");

  const fetchmodules = async (courseId) => {
    try {
      const response = await fetch("/api/modules");
      console.log(response, "fetch module response");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to load modules");
      }
      const data = await response.json();
      console.log(data.data, courseId, "fetch module data");

      const filteredModules = Array.isArray(data?.data)
        ? data.data.filter((module) => module.courseId === courseId).reverse() // if data.data is newest first, reverse to get oldest first
        : [];

      setmodules(filteredModules);

      // setmodules(Array.isArray(data?.data) ? data?.data : (data|| []))
      setError(null);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatemodule = async (formData) => {
    const data = JSON.stringify({
      title: formData?.title,
      description: formData?.description,
      courseId: id, // make sure `id` is defined in the scope
      order: 1,
    });

    console.log(data, id, "here to see here data");
    const response = await fetch("/api/modules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    if (response.ok) {
      fetchmodules(id); // Refresh the list of modules
      setModuleModal(false); // Close the modal
    } else {
      console.error("Failed to create module");
    }
  };

  const handleEditmodule = (module) => {
    setEditmodule(module);
    setIsEditModalOpen(true);
  };

  const handleUpdatemodule = async (moduleData) => {
    try {
      const data = JSON.stringify({
        title: moduleData?.title,
        description: moduleData?.description,
        courseId: id, // make sure `id` is defined in the scope
        order: 1,
      });
      const response = await fetch(`/api/modules/${editmodule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });
      if (response.ok) {
        fetchmodules(id);
        setIsEditModalOpen(false);
      } else {
        console.error("Failed to update module");
      }
    } catch (error) {
      console.error("Error updating module:", error);
    }
  };

  const handleDeletemodule = (id) => {
    setDeletemoduleId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletemodule = async () => {
    try {
      const response = await fetch(`/api/modules/${deletemoduleId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchmodules(id);
        setIsDeleteModalOpen(false);
      } else {
        console.error("Failed to delete module");
      }
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile || !id) return;
    setBulkLoading(true);
    setBulkError(null);
    try {
      const formData = new FormData();
      formData.append("csvFile", bulkFile);
      formData.append("courseId", id);
      const response = await fetch("/api/modules/bulkupload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchmodules(id);
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

  const filteredmodules = modules.filter((module) => {
    const matchesSearch = module.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || module.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  console.log(filteredmodules, "filteredmodules");

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
              <Button
                variant="ghost"
                onClick={() => navigate(`/course-manager`)}
                className="mr-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Module Manager
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your modules and their content
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => setModuleModal(true)}
              >
                <Plus className="h-4 w-4" />
                Add module
              </motion.button>
              {/* <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                onClick={() => setIsBulkModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Upload With CSV
              </motion.button> */}
            </div>
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
              placeholder="Search modules..."
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

        {/* module List */}

        <div className="space-y-4">
          {modules.map((module, index) => (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded">
                        Module {index + 1}
                      </span>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {module.title}
                      </CardTitle>
                    </div>
                    <p className="text-gray-600 mb-3">{module.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <PlayCircle className="w-4 h-4 mr-1" />
                      {module.lessonCount} lessons
                      <span className="mx-2">•</span>
                      Created {new Date(module.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      className="cursor-pointer"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditmodule(module)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletemodule(module.id)}
                      className="text-red-600 cursor-pointer hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-[#fff]"
                      onClick={() =>
                        navigate(`/lessons?id=${id}&moduleId=${module?.id}`)
                      }
                    >
                      Manage Lessons
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-12">
            <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No modules yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start building your course by adding modules
            </p>
            <Button
              onClick={() => setModuleModal(true)}
              className="bg-purple-600 hover:bg-purple-700 mt-3 text-[#fff]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>
        )}
      </div>
      {moduleModal && (
        <AddModuleModal
          isOpen={moduleModal}
          onClose={() => setModuleModal(false)}
          onSubmit={handleCreatemodule}
        />
      )}

      {isEditModalOpen && (
        <UpdateModuleModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdatemodule}
          editmodule={editmodule}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this module?</p>
            <div className="flex gap-4 mt-6">
              <button
                className="bg-gray-200 px-4 py-2 cursor-pointer rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white cursor-pointer px-4 py-2 rounded"
                onClick={confirmDeletemodule}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isBulkModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <form
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
            onSubmit={handleBulkUpload}
          >
            <h2 className="text-lg font-semibold mb-4">
              Upload Modules with CSV
            </h2>
            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            {bulkError && (
              <div className="text-red-600 mb-4 text-sm">{bulkError}</div>
            )}
            <div className="flex gap-4">
              <button
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkFile(null);
                  setBulkError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                type="submit"
                disabled={bulkLoading || !bulkFile}
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
