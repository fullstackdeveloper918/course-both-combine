import React, { useState, useEffect } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ProgressBar from "../components/ProgressBar";

const ThreadEdit = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [users, setUsers] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get thread ID from the URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const threadId = searchParams.get("id");
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
        console.error("Error fetching categorys:", error);
      }
    };

    fetchCategory();
  }, []);

  // Fetch users
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

  // Fetch thread details - removed categoryId dependency
  useEffect(() => {
    const fetchThreadDetails = async () => {
      if (threadId) {
        try {
          const response = await fetch(
            `/api/single-threads?thread_id=${threadId}`
          );
          const data = await response.json();

          if (response.ok) {
            setTitle(data?.data?.title);
            setContent(data?.data?.content);
            setUserId(data?.data?.user_id);
            setCategoryId(data?.data?.category_id);
          } else {
            toast.error(data.message || "Failed to fetch thread details");
          }
        } catch (error) {
          console.error("Error fetching thread details:", error);
          toast.error("Error fetching thread details");
        }
      }
    };

    fetchThreadDetails();
  }, [threadId]); // Only depend on threadId, not categoryId

  const handleUpdateThread = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/update-threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          thread_id: threadId,
          category_id: categoryId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Thread updated successfully!", { autoClose: 2000 });
        navigate("/thread"); // Navigate back to the threads list page
      } else {
        toast.error(result.message || "Failed to update thread.", {
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating thread:", error);
      toast.error("Error updating thread.");
    } finally {
      setLoading(false);
    }
  };

  if (!title)
    return (
      <>
        <ProgressBar data={title} />
      </>
    );

  return (
    <div className="pl-12">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 bg-gray-200 cursor-pointer hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md"
      >
        <FaArrowLeftLong size={13} />
      </button>

      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "50px auto",
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
          Edit Thread
        </h2>
        <form onSubmit={handleUpdateThread}>
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
              Thread Title
            </label>
            <input
              type="text"
              id="title"
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
              Thread Content
            </label>
            <input
              type="text"
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              backgroundColor: "white",
              color: "black",
              border: "1px solid gray",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            {loading ? "Updating..." : "Update Thread"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ThreadEdit;
