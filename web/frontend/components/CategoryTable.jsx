import React, { useEffect, useState } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ReactPaginate from "react-paginate";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
// import ClipLoader from "react-spinners/ClipLoader";

const CategoryTable = ({ category, setCategory, fetchCategories }) => {
  const [loadingCategoryId, setLoadingCategoryId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
  const [showNoCategoriesMessage, setShowNoCategoriesMessage] = useState(false); // State for showing "No Category found" message
  const navigate = useNavigate();
  const location = useLocation();
  const itemsPerPage = 10;

  const handleDetailsCategory = (id) => {
    navigate(`/category-details?id=${id}`);
  };

  const handleEditCategory = (id) => {
    navigate(`/category-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setLoadingCategoryId(id);
    try {
      const response = await fetch(`/api/delete-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Category deleted successfully!", { autoClose: 2000 });
        fetchCategories(); // Refresh the category list
      } else {
        toast.error(result.message || "Failed to delete category.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setLoadingCategoryId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setCategoryIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryIdToDelete(null);
  };

  useEffect(() => {
    // Set a timeout before showing "No Category found" message
    const timer = setTimeout(() => {
      if (!category?.length) {
        setShowNoCategoriesMessage(true);
      }
    }, 2000); // 2-second delay before showing the "No Category found" message

    return () => clearTimeout(timer); // Clean up the timeout when the component unmounts or the category state changes
  }, [category?.data]);


console.log(category,"category here props");

  const queryParams = new URLSearchParams(location.search);
  const currentPage = parseInt(queryParams.get("page")) || 1;
  const currentCategories = category || [];
  const pageCount = Math.ceil((category?.total || 0) / itemsPerPage);

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />
      {currentCategories ? (
        <>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-4">Current Category</th>
                <th className="p-4">Shop</th>
                <th className="p-4">Shopify Domain</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
     
                <tr key={currentCategories.category_id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{currentCategories?.storeStyle?.name || "N/A"}</td>
                  <td className="p-4">{currentCategories?.shop || "N/A"}</td>
                  <td className="p-4">{currentCategories?.shopifyDomain || "N/A"}</td>

                  <td className="p-4 flex gap-2">
                    {/* <button onClick={() => handleDetailsCategory(currentCategories?.storeStyle?.id)} className="text-blue-500 hover:text-blue-700 cursor-pointer">
                      <IoEyeSharp />
                    </button> */}
                    <button onClick={() => handleEditCategory(currentCategories?.storeStyle?.id)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                      <FaEdit />
                    </button>
                    {/* <button
                      onClick={() => openDeleteModal(currentCategories?.storeStyle?.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      disabled={loadingCategoryId === currentCategories.id}
                    >
                      {loadingCategoryId === currentCategories.id ? "Deleting..." : <RiDeleteBin6Line />}
                    </button> */}
                  </td>
                </tr>
          
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
            previousLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
            nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === pageCount  ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
            pageLinkClassName="px-3 py-1 cursor-pointer"
          />
        )} 
        </>
      ) :   showNoCategoriesMessage ? ( // Check if to show the "No posts found" message
            <p className="text-center text-gray-500 dark:text-gray-400">No category found.</p>
          ) : (
            <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
            <p className="text-center text-gray-500 dark:text-gray-400">Loading categories...</p>
          </div>
          )
      }

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDelete}
        id={categoryIdToDelete}
      />
    </div>
  );
};

export default CategoryTable;
