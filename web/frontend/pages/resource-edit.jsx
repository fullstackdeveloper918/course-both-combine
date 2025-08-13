import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const UpdateResource = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const resourceId = searchParams.get("id");
  const navigate = useNavigate();

  useEffect(() => {
    if (!resourceId) return; // Ensure userId is available

    const fetchResourceDetails = async () => {
      try {
        const response = await fetch(`/api/single-resource-library?resource_id=${resourceId}`); // Correct query param
        const result = await response.json();

        if (response.ok) {
            setTitle(result?.data?.title); // Access `data` field from the response
            setContent(result?.data?.content); // Access `data` field from the response
            setResourceType(result?.data?.resource_type); // Access `data` field from the response
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError("Failed to fetch resource details.");
      }
    };

    fetchResourceDetails();
  }, [resourceId]);

  // Handle file input
 

  // Update user information
  const handleUpdateResource = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let requestBody = { resource_id: resourceId };

      if (title) requestBody.title = title;
      if (content) requestBody.content = content;
      if (resourceType) requestBody.resource_type = resourceType; // Include country in the request

      const response = await fetch("/api/update-resource-library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Resource updated successfully!", { autoClose: 2000 });
        navigate("/resource_library");
      } else {
        toast.error(result.message || "Failed to update Resource.");
      }
    } catch (error) {
      toast.error("Error updating Resource.");
    } finally {
      setLoading(false);
    }
  };

  if (!title) return <><ProgressBar data={title} /></>;

  return (
    <div className="pl-12">
      <button onClick={() => navigate(-1)} className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md">
        <FaArrowLeftLong size={13} />
      </button>

      <div style={{ width: "100%", maxWidth: "400px", margin: "10px auto", padding: "10px 20px", backgroundColor: "#f9f9f9", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
        <ToastContainer />
        <h2 style={{ textAlign: "center", fontSize: "24px", color: "#333", marginBottom: "20px" }}>Update Resource</h2>

        <form onSubmit={handleUpdateResource}>
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="title" style={{ display: "block", fontSize: "14px", color: "#555", marginBottom: "5px" }}>Title</label>
            <input type="text" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="content" style={{ display: "block", fontSize: "14px", color: "#555", marginBottom: "5px" }}>Content</label>
            <input type="text" id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label htmlFor="resource_type" style={{ display: "block", fontSize: "14px", color: "#555", marginBottom: "5px" }}>Resource Type</label>
            <select id="resource_type" value={resourceType} onChange={(e) => setResourceType(e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}>
              <option value="">Select Resource type</option>
              <option value="article">article</option>
              <option value="guide">guide</option>
              <option value="video">video</option>
              <option value="webinar">webinar</option>
            </select>
          </div>



          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", backgroundColor: "gray", color: "#fff", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
            {loading ? "Updating..." : "Update Resource"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateResource;
