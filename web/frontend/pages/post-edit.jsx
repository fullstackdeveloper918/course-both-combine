import React, { useState, useEffect } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ReactQuill from "react-quill"; // Import ReactQuill
import "react-quill/dist/quill.snow.css"; // Import the default styles for ReactQuill
import ProgressBar from "../components/ProgressBar";
// import e from "express";

const PostEdit = () => {
  const [threadId, setThreadId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [content, setContent] = useState(""); // Content for ReactQuill
  const [title, setTitle] = useState(""); // Title for the post
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [hover, setHover] = useState(false);
  const [categoryId, setCategoryId] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagId, setTagId] = useState();
  const [existingImage, setExistingImage] = useState("");

  const searchParams = new URLSearchParams(location.search);
  const postId = searchParams.get("id");

  const [thread, setThread] = useState([]);

  const [category, setCategory] = useState([]);

  // Fetch categories
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch("/api/get-all-category");
        const data = await response.json();
        setCategory(data);
        console.log("categorydata", data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategory();
  }, []);

  useEffect(() => {
    const fetchThread = async () => {
      try {
        const response = await fetch("/api/get-all-threads");
        const data = await response.json();
        setThread(data);
        console.log("possstdata", data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchThread();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/get-all-users-list");
        const data = await response.json();
        setUsers(data);
        console.log("data", data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setTags([]); // Clear tags if no category is selected
      return;
    }

    const fetchTags = async () => {
      try {
        const response = await fetch(
          `/api/get-tag-by-category?category_id=${categoryId}`
        );
        const data = await response.json();
        setTags(data?.data || []); // Set tags from the API response
        console.log("Tags data:", data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchTags();
  }, [categoryId]); // Trigger when category_id changes

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (postId) {
        try {
          const response = await fetch(`/api/single-post?post_id=${postId}`);
          const data = await response.json();

          if (response.ok) {
            setUserId(data?.data?.user_id);
            setThreadId(data?.data?.thread_id);
            setTitle(data?.data?.title);
            setContent(data?.data?.content); // Set content for ReactQuill
            setCategoryId(data?.data?.category_id);
            setTagId(data?.data?.tag_id);
            setExistingImage(data?.data?.image);
          } else {
            toast.error(data.message || "Failed to fetch post details");
          }
        } catch (error) {
          console.error("Error fetching post details:", error);
          toast.error("Error fetching post details");
        }
      }
    };

    fetchPostDetails();
  }, [postId]);

  const handleTagChange = (e) => {
    const selectedTagId = e.target.value;
    setTagId(selectedTagId);
  };

  console.log("tagid is there", tagId);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("seelectedFile", selectedFile);
    setFile(selectedFile);
  };

  console.log("file of image", file);

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("post_id", postId);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("user_id", userId);
      formData.append("category_id", categoryId);
      formData.append("tag_id", tagId !== null ? tagId : null);
      formData.append("thread_id", threadId);

      if (file) {
        formData.append("file", file); // Append the file
      }

      const response = await fetch(`/api/update-post`, {
        method: "POST",
        body: formData, // Send FormData directly
      });

      //   const response = await fetch(`/api/update-post`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       post_id: postId,
      //       title,
      //       content,
      //       user_id: userId,
      //       category_id: categoryId,
      //       tag_id: tagId,
      //       thread_id: threadId,
      //       file: file,
      //     }),
      //   });

      const result = await response.json();

      if (response.ok) {
        toast.success("Post updated successfully!", { autoClose: 2000 });
        navigate("/post");
      } else {
        toast.error(result.message || "Failed to update Post.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Error updating post.");
    } finally {
      setLoading(false);
    }
  };

  if (!content)
    return (
      <>
        <ProgressBar data={content} />
      </>
    );

  return (
    <div className="pl-12">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md"
      >
        <FaArrowLeftLong size={13} />
      </button>

      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "20px auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ToastContainer />
        <h2
          style={{
            textAlign: "center",
            fontSize: "24px",
            color: "#333",
            marginBottom: "20px",
          }}
        >
          Update Post
        </h2>
        <form onSubmit={handleUpdatePost}>
          {/* Title Input */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="title"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Post Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Thread Dropdown */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="threadId"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Select Thread
            </label>
            <select
              id="thread_id"
              name="thread_id"
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a thread</option>
              {thread?.data?.map((thread) => (
                <option key={thread.thread_id} value={thread.thread_id}>
                  {thread.title}
                </option>
              ))}
            </select>
          </div>

          {/* User Dropdown */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="userId"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Select User
            </label>
            <select
              id="user_id"
              name="user_id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a user</option>
              {users?.data?.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="categoryId"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Select Category
            </label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId || ""}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select a category</option>
              {category?.data?.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Dropdown */}
          {categoryId && (
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">
                Select Tag
              </label>
              <select
                name="tag_id"
                value={tagId}
                onChange={handleTagChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a tag</option>
                {tags?.map((tag) => (
                  <option key={tag.tag_id} value={tag.tag_id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* React Quill Content Editor */}
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="content"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Content
            </label>
            <ReactQuill
              value={content}
              onChange={setContent}
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="file"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Post Image
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: "100%", cursor: "pointer" }}
            />
            {existingImage && !file && (
              <p style={{ marginTop: "5px", fontSize: "12px", color: "#777" }}>
                Current: {existingImage}
              </p>
            )}
            {file && (
              <p style={{ marginTop: "5px", fontSize: "12px", color: "#777" }}>
                New: {file.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              backgroundColor: hover ? "white" : "#F1F1F1",
              color: hover ? "gray" : "black",
              border: "1px solid gray",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            disabled={loading}
          >
            {loading ? (
              <span>Updating Post...</span>
            ) : (
              "Update Post"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostEdit;
