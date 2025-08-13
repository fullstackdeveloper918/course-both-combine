import React, { useState, useEffect } from "react";
import { IoEyeSharp } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import ReactPaginate from "react-paginate";
// import ClipLoader from "react-spinners/ClipLoader";

const ThreadTable = ({ thread, setThread, totalPages, currentPage, onPageChange }) => {
    const [deletingThreadId, setDeletingThreadId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [threadIdToDelete, setThreadIdToDelete] = useState(null);
    const [noDataMessage, setNoDataMessage] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!thread?.data?.length) {
            setTimeout(() => {
                setNoDataMessage(true);
            }, 1000);
        } else {
            setNoDataMessage(false);
        }
    }, [thread]);

    const handleDetailsThread = (id) => {
        navigate(`/thread-details?id=${id}`);
    };

    const handleEditPost = (id) => {
        navigate(`/thread-edit?id=${id}`);
    };

    const handleDelete = async (id) => {
        setDeletingThreadId(id);
        try {
            const response = await fetch(`/api/delete-threads`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ thread_id: id }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Thread deleted successfully!", { autoClose: 2000 });
                const updatedThread = thread?.data?.filter(
                    (thread) => thread.thread_id !== id
                );
                setThread({ data: updatedThread });
            } else {
                toast.error(result.message || "Failed to delete thread.", { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
        } finally {
            setDeletingThreadId(null);
            setIsModalOpen(false);
        }
    };

    const openDeleteModal = (id) => {
        setThreadIdToDelete(id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setThreadIdToDelete(null);
    };

    return (
        <div className="overflow-x-auto mx-auto max-w-5xl p-4">
            <ToastContainer />
            {thread?.data?.length > 0 ? (
                <>
                    <table className="w-full border-collapse bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-left">
                                <th className="p-4">Title</th>
                                <th className="p-4">Content</th>
                                <th className="p-4">Category Name</th>
                                <th className="p-4">User Name</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thread?.data?.map((thread, index) => (
                                <tr key={index} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-300">
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{thread.title || 'N/A'}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{thread.content || 'N/A'}</td>
                                    <td className="p-4 text-gray-900 dark:text-white">{thread.name || 'Uncategories'}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{thread.username || 'N/A'}</td>
                                    <td className="py-6 flex justify-center gap-4">
                                        <button onClick={() => handleDetailsThread(thread.thread_id)} className="text-blue-500 hover:text-blue-700 cursor-pointer">
                                            <IoEyeSharp />
                                        </button>
                                        <button onClick={() => handleEditPost(thread.thread_id)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => openDeleteModal(thread.thread_id)} className="text-red-500 hover:text-red-700 cursor-pointer" disabled={deletingThreadId === thread.thread_id}>
                                            {deletingThreadId === thread.thread_id ? "Deleting..." : <RiDeleteBin6Line />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4">
                    {totalPages > 1 && (
                        <ReactPaginate
                            previousLabel={"Previous"}
                            nextLabel={"Next"}
                            breakLabel={"..."}
                            pageCount={totalPages}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={3}
                            onPageChange={onPageChange}
                            containerClassName="flex justify-center py-4 gap-4"
                            activeClassName="font-bold text-blue-500"
                            previousLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
                            nextLinkClassName={`px-3 py-1 rounded cursor-pointer ${currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
                            pageLinkClassName="px-3 py-1 cursor-pointer"
                        />
                    )} 
                    </div>
                </>
            ) : noDataMessage ? (
                <p className="text-center text-gray-500 dark:text-gray-400">No thread found.</p>
            ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                <p className="text-center text-gray-500 dark:text-gray-400">Loading Thread...</p>
            </div>
            )}

            <ConfirmDeleteModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onConfirm={handleDelete}
                id={threadIdToDelete}
            />
        </div>
    );
};

export default ThreadTable;
