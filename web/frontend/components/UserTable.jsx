import React, { useState, useEffect } from "react";
// import { CgLayoutGrid } from "react-icons/cg";
import { FaEdit } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ReactPaginate from "react-paginate";
// import ClipLoader from "react-spinners/ClipLoader";

const UserTable = ({ users, setUsers, port }) => {
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showNoUsersMessage, setShowNoUsersMessage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for opening/closing the modal
  const [userIdToDelete, setUserIdToDelete] = useState(null); // Store the user ID to delete
  const navigate = useNavigate();
  const location = useLocation();

  const itemsPerPage = 10;
  const queryParams = new URLSearchParams(location.search);
  const currentPage = parseInt(queryParams.get("page")) || 1;
  const currentUsers = users?.data || [];
  const pageCount = Math.ceil((users?.total || 0) / itemsPerPage);

  useEffect(() => {
    // Set a timeout before showing "No users found" message
    const timer = setTimeout(() => {
      if (!users?.length) {
        setShowNoUsersMessage(true);
      }
    }, 2000); // 2-second delay before showing the "No users found" message

    return () => clearTimeout(timer); // Clean up the timer if the component unmounts
  }, [users?.data]);

  const handleDetailsUser = (id) => {
    navigate(`/user-details?id=${id}`);
  };

  const handleEditUser = (id) => {
    navigate(`/user-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setDeletingUserId(id);
    try {
      const response = await fetch(`/api/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User deleted successfully!", { autoClose: 2000 });
        const updatedUsers = users?.data?.filter((user) => user.user_id !== id);
        setUsers({ ...users, data: updatedUsers });
      } else {
        toast.error(result.message || "Failed to delete user.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeletingUserId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setUserIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal without deleting
    setUserIdToDelete(null); // Reset the user ID
  };

  const capitalizeUsername = (username) => {
    if (!username) return username; // Handle case when username is empty
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  };
  // console.log("pageCount",pageCount)
  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />

      {currentUsers.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                <th className="p-4">Profile</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Country</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.data?.map((user, index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300"
                >
                  <td className="p-4">
                    <img
                      className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      src={
                        user.profile_picture
                          ? `https://zocdoc-admin.onrender.com/uploads/${user.profile_picture}`
                          : "https://dovercourt.org/wp-content/uploads/2019/11/610-6104451_image-placeholder-png-user-profile-placeholder-image-png-286x300.jpg"
                      }
                      alt="Profile"
                    />
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">
                    {capitalizeUsername(user.username)}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {user.email || "N/A"}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      {user.role || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      {user.country || "N/A"}
                    </span>
                  </td>
                  <td className="py-8 flex justify-center gap-4">
                    <button
                      onClick={() => handleDetailsUser(user.user_id)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <IoEyeSharp />
                    </button>
                    <button
                      onClick={() => handleEditUser(user.user_id)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openDeleteModal(user.user_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={deletingUserId === user.user_id}
                    >
                      {deletingUserId === user.user_id ? (
                        "Deleting..."
                      ) : (
                        <RiDeleteBin6Line />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && (
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              pageCount={pageCount}
              onPageChange={({ selected }) => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set("page", selected + 1);
                navigate(`?${searchParams.toString()}`);
              }}
              forcePage={currentPage - 1}
              containerClassName="flex justify-center py-4 gap-4"
              activeClassName="font-bold text-blue-500"
              previousLinkClassName={`px-3 py-1 rounded cursor-pointer ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200"
              }`}
              nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${
                currentPage === pageCount
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200"
              }`}
              pageLinkClassName="px-3 py-1 cursor-pointer"
            />
          )}
          <ConfirmDeleteModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onConfirm={() => handleDelete(userIdToDelete)}
          />
        </>
      ) : (
        !showNoUsersMessage && (
          // <p className="text-center text-gray-500 dark:text-gray-400">No user found.</p>
          // ) : (
          <div className="flex flex-col items-center justify-center">
            {/* <ClipLoader
            color={"black"}
            loading={true}
            // cssOverride={override}
            size={40}
            aria-label="Loading Spinner"
            data-testid="loader"
          /> */}
            {/* <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-50 z-50"> */}
            <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
            <p className="text-center text-gray-500 dark:text-gray-400">
              Loading users...
            </p>
            {/* </div> */}
          </div>
        )
      )}
    </div>
  );
};

export default UserTable;
