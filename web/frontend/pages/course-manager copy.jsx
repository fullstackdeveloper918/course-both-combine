import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import CreateCourseModal from "../components/modals/create-course-modal"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import AddModuleModal from "../components/modals/add-module-modal"
import { useNavigate } from "react-router-dom"

export default function CourseManager() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteCourseId, setDeleteCourseId] = useState(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState(null)
  const [moduleModal, setModuleModal] = useState(false)

    const navigate = useNavigate()
  
  useEffect(() => {
    fetchCourses()
  }, [])

  console.log(moduleModal,"moduleModal")

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses")
      console.log(response, 'fetch course response')
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error("Failed to load courses")
      }
      const data = await response.json()
      console.log(data, 'fetch course data')
      setCourses(Array.isArray(data) ? data : (data.data || []))
      setError(null)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


 const handleCreateCourse = async (formData) => {
  const response = await fetch("/api/courses", {
    method: "POST",
    body: formData, // No need to set headers
  })

  if (response.ok) {
    fetchCourses()
    setIsCreateModalOpen(false)
  } else {
    console.error("Failed to create course")
  }
}

  const handleEditCourse = (course) => {
    setEditCourse(course)
    setIsEditModalOpen(true)
  }

  const handleUpdateCourse = async (courseData) => {
    try {
      const formData = new FormData()
      Object.keys(courseData).forEach((key) => {
        formData.append(key, courseData[key])
      })
      const response = await fetch(`/api/courses/${editCourse.id}`, {
        method: "PUT",
        body: formData,
      })
      if (response.ok) {
        fetchCourses()
        setIsEditModalOpen(false)
      } else {
        console.error("Failed to update course")
      }
    } catch (error) {
      console.error("Error updating course:", error)
    }
  }

  const handleDeleteCourse = (id) => {
    setDeleteCourseId(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${deleteCourseId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchCourses()
        setIsDeleteModalOpen(false)
      } else {
        console.error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!bulkFile) return
    setBulkLoading(true)
    setBulkError(null)
    try {
      const formData = new FormData()
      formData.append("file", bulkFile)
      const response = await fetch("/api/courses/bulkupload", {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        fetchCourses()
        setIsBulkModalOpen(false)
        setBulkFile(null)
      } else {
        setBulkError("Failed to upload CSV")
      }
    } catch (error) {
      setBulkError(error.message)
    } finally {
      setBulkLoading(false)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || course.status === filterStatus
    return matchesSearch && matchesFilter
  })

  console.log(filteredCourses,"filteredCourses")

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          {error.includes("Authentication") && (
            <p className="mt-4 text-sm text-gray-500">
              Your session may have expired. Please try refreshing the page or navigating back to your Shopify home.
            </p>
          )}
        </div>
      </div>
    );
  }

  console.log(isCreateModalOpen, 'isCreateModalOpen')

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full  px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Manager</h1>
              <p className="text-gray-600 mt-1">Manage your courses and their content</p>
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

        {/* Course List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
              <td             onClick={() => navigate("/module-manager")}
 className="cursor-pointer px-6 py-4 whitespace-nowrap">

                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={course.thumbnail || "/placeholder.svg"}
                          alt={course.title}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          <div className="text-sm text-gray-500">{course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.students ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${course.revenue ? Number(course.revenue).toLocaleString() : "0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === "published"
                            ? "bg-green-100 text-green-800"
                            : course.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-gray-400 hover:text-blue-600"
                          title="View Course"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-yellow-600"
                          title="Edit Course"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600"
                          title="Delete Course"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {moduleModal && <AddModuleModal
           isOpen={moduleModal}
        onClose={() => setModuleModal(false)}
      />}

{isCreateModalOpen &&
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
      >
      
      </CreateCourseModal>}
      {isEditModalOpen && (
        <CreateCourseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateCourse}
          initialData={editCourse}
          isEdit
        />
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete this course?</p>
            <div className="flex gap-4 mt-6">
              <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={confirmDeleteCourse}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {isBulkModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <form className="bg-white p-6 rounded-lg shadow-lg" onSubmit={handleBulkUpload}>
            <h2 className="text-lg font-semibold mb-4">Bulk Upload Courses (CSV)</h2>
            <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files[0])} required />
            {bulkError && <div className="text-red-600 mt-2">{bulkError}</div>}
            <div className="flex gap-4 mt-6">
              <button className="bg-gray-200 px-4 py-2 rounded" type="button" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={bulkLoading}>{bulkLoading ? "Uploading..." : "Upload"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
} 