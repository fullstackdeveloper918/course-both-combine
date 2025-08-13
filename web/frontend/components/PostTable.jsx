import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { IoEyeSharp } from "react-icons/io5";
import ReactPaginate from "react-paginate";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
// import ClipLoader from "react-spinners/ClipLoader";

const PostTable = ({ post, setPost }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [deletingPostId, setDeletingPostId] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [postIdToDelete, setPostIdToDelete] = React.useState(null);
  const [showNoPostsMessage, setShowNoPostsMessage] = useState(false);

  const itemsPerPage = 10;
  const queryParams = new URLSearchParams(location.search);
  const currentPage = parseInt(queryParams.get("page")) || 1;
  const currentPosts = post?.data || [];
  const pageCount = Math.ceil((post?.total || 0) / itemsPerPage);

  const handleDetailsPost = (id) => {
    navigate(`/post-details?id=${id}`);
  };

  const handleEditPost = (id) => {
    navigate(`/post-edit?id=${id}`);
  };

  const handleDelete = async (id) => {
    setDeletingPostId(id);
    try {
      const response = await fetch("/api/delete-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: id }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success("Post deleted successfully!", { autoClose: 2000 });
        const updatedPost = post?.data?.filter((post) => post.post_id !== id);
        setPost({ ...post, data: updatedPost });
      } else {
        toast.error(result.message || "Failed to delete post.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    } finally {
      setDeletingPostId(null);
      setIsModalOpen(false);
    }
  };

  const openDeleteModal = (id) => {
    setPostIdToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPostIdToDelete(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!post?.length) {
        setShowNoPostsMessage(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [post]);

  console.log("currentPosts", pageCount);

  const capitalizeUsername = (username) => {
    if (!username) return username; // Handle case when username is empty
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  };

  return (
    <div className="overflow-x-auto mx-auto max-w-5xl p-4">
      <ToastContainer />

      {currentPosts.length > 0 ? (
        <>
          <table className="w-full border-collapse bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-4">Post Image</th>
                <th className="p-4">Username</th>
                <th className="p-4">Title</th> {/* Added Title Column */}
                <th className="p-4">Content</th>
                <th className="p-4">Views</th>
                <th className="p-4">Thread Title</th>
                <th className="w-40">Category Name</th>
                <th className="p-1 w-40">Tag Name</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts?.map((postItem) => (
                <tr
                  key={postItem.post_id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4 w-32">
                    <img
                      className="w-32 h-20 rounded-2xl"
                      src={
                        postItem.image
                          ? `https://zocdoc-admin.onrender.com/uploads/${postItem.image}`
                          : "https://fimacf.in/wp-content/uploads/2020/04/placeholder.png"
                      }
                      alt="Post Image"
                    />
                  </td>
                  {/* <td className="p-4">{postItem.author || "N/A"}</td> */}
                  <td className="p-4">
                    {capitalizeUsername(postItem.author || "N/A")}
                  </td>
                  {/* {capitalizeUsername(postItem.author || "N/A")} */}
                  <td className="p-4">{postItem.title || "N/A"}</td>{" "}
                  {/* Display Post Title */}
                  {/* <td className="p-4">
                    <div
                      dangerouslySetInnerHTML={{ __html: postItem.content }}
                    />
                  </td> */}
                  <td className="p-4">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          postItem.content.split(" ").slice(0, 5).join(" ") +
                          (postItem.content.split(" ").length > 5 ? "..." : ""),
                      }}
                    />
                  </td>
                  <td className="p-4">{postItem.views}</td>
                  <td className="p-4">{postItem.thread_title || "N/A"}</td>
                  <td className="p-4">
                    {postItem.category_name || "Uncategorized"}
                  </td>
                  <td className="p-4">{postItem.tag_name || "N/A"}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleDetailsPost(postItem.post_id)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <IoEyeSharp />
                    </button>
                    <button
                      onClick={() => handleEditPost(postItem.post_id)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => openDeleteModal(postItem.post_id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <RiDeleteBin6Line />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageCount >= 1 && (
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
            onConfirm={() => handleDelete(postIdToDelete)}
            id={postIdToDelete}
          />
        </>
      ) : showNoPostsMessage ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No posts found.
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-t-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading posts...
          </p>
        </div>
      )}
    </div>
  );
};

export default PostTable;
