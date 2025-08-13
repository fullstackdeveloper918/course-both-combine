import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import AddStudentModal from "../components/modals/add-student-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Label } from "../components/ui/label"
import { Input } from "../components/ui/input"


export default function StudentPortal() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", shopifyCustomerId: "" })
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("student")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
 
      const response = await fetch(`/api/users`);
      const data = await response.json()
      setStudents(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const fullName = ((student.firstName || "") + " " + (student.lastName || "")).trim();
    const nameToSearch = fullName || student.name || "";
    const matchesSearch =
      nameToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  })

  const handleAddStudent = async (student) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (response.ok) {
        const newStudent = await response.json();
        setStudents((prev) => [
          {
            ...newStudent,
            id: newStudent.id || Date.now(),
            status: newStudent.status || "active",
            joinDate: newStudent.joinDate || new Date().toLocaleDateString(),
            avatar: newStudent.avatar || "",
            phone: newStudent.phone || "",
            enrolledCourses: newStudent.enrolledCourses || 0,
          },
          ...prev,
        ]);
        setIsAddStudentModalOpen(false);
      } else {
        console.error("Failed to add student");
      }
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student)
    setEditForm({
      name: student.name,
      email: student.email,
      shopifyCustomerId: student.shopifyCustomerId || ""
    })
    setIsEditStudentModalOpen(true)
  }

  const handleEditStudentSubmit = (e) => {
    e.preventDefault()
    setStudents((prev) => prev.map(s => s.id === selectedStudent.id ? { ...s, ...editForm } : s))
    setIsEditStudentModalOpen(false)
    setSelectedStudent(null)
  }

  const handleDeleteStudent = (student) => {
    setSelectedStudent(student)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteStudent = () => {
    setStudents((prev) => prev.filter(s => s.id !== selectedStudent.id))
    setIsDeleteDialogOpen(false)
    setSelectedStudent(null)
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
              <p className="text-gray-600 mt-1">Manage your students and their enrollments</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              onClick={() => setIsAddStudentModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Student
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled Courses
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
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={student.avatar || "/placeholder-avatar.svg"}
                          alt={student.name}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">Joined {student.joinDate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {student.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {student.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{student.enrolledCourses} courses</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === "active"
                            ? "bg-green-100 text-green-800"
                            : student.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-gray-400 hover:text-blue-600"
                          title="View Student"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-yellow-600"
                          title="Edit Student"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-red-600"
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(student)}
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

        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          onSubmit={handleAddStudent}
        />

        {/* Edit Student Modal */}
        <Dialog open={isEditStudentModalOpen} onOpenChange={setIsEditStudentModalOpen}>
          <DialogContent className="bg-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditStudentSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editStudentName">Full Name</Label>
                <Input
                  id="editStudentName"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStudentEmail">Email</Label>
                <Input
                  id="editStudentEmail"
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editShopifyCustomerId">Shopify Customer ID (Optional)</Label>
                <Input
                  id="editShopifyCustomerId"
                  value={editForm.shopifyCustomerId}
                  onChange={e => setEditForm(f => ({ ...f, shopifyCustomerId: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditStudentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-white sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Delete Student</DialogTitle>
            </DialogHeader>
            <div>Are you sure you want to delete this student?</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteStudent}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 