"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateCourseModal from "../components/modals/create-course-modal";

export default function HomePage() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    completionRate: 0,
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchCourses();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const statsResponse = await fetch("/api/dashboard/stats");
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent courses
      const coursesResponse = await fetch("/api/courses?limit=5");
      const coursesData = await coursesResponse.json();
      // setCourses(coursesData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      console.log(data?.data, "fetch dashboard course data");

      setCourses(data?.data);
      setStats((prevStats) => ({
        ...prevStats,
        totalCourses: data?.data.length || 0,
      }));
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

  useEffect(() => {
    const filtered = courses.filter((course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  const StatCard = ({ icon: Icon, title, value, change, color, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 ${
                change > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Here's what's happening with your courses.
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            title="Total Courses"
            value={stats.totalCourses}
            change={12}
            color="bg-blue-500"
            onClick={() => navigate("/course-manager")}
          />
          <StatCard
            icon={Users}
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            change={8}
            color="bg-green-500"
            onClick={() => navigate("/student-portal")}
          />
          <StatCard
            icon={DollarSign}
            title="Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            change={15}
            color="bg-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            change={-2}
            color="bg-orange-500"
          />
        </div>

        {/* Recent Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Courses
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course, index) => (
                  <motion.tr
                    onClick={() => navigate(`/modules-manager?id=${course.id}`)}
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={
                            course.thumbnail ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={course.title}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.students ? course.students : "0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.revenue ? course.revenue : "0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td> */}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
      />
    </div>
  );
}
