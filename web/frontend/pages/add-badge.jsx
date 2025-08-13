import React, { useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const AddBadge = () => {
  const [formData, setFormData] = useState({
    badge_name: "",
    points_required: "",
  });

  const [errors, setErrors] = useState({
    badge_name: "",
    points_required: "",
  });

  const [loading, setLoading] = useState(false)

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.badge_name.trim()) {
      newErrors.badge_name = "Badge name is required.";
      isValid = false;
    }

    if (!formData.points_required.trim()) {
      newErrors.points_required = "Point required is required.";
      isValid = false;
    } else if (isNaN(formData.points_required)) {
      newErrors.points_required = "Point required must be a number.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/add-badges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          badge_name: formData.badge_name,
          points_required: parseInt(formData.points_required),
        }),
      });

      if (!response.ok) throw new Error("Failed to add badge");

      const data = await response.json();
      if (response.ok) {
        toast.success("Badge added successfully", { autoClose: 2000 });
        navigate("/badges");
      }
      console.log("Badge added successfully:", data);

      setFormData({ badge_name: "", points_required: "" });
    } catch (error) {
      console.error("Error:", error);
    }finally {
      setLoading(false);  // Stop loading
    }
  };

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
          Create Badge
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="badge_name"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Badge Name
            </label>
            <input
              type="text"
              id="badge_name"
              name="badge_name"
              value={formData.badge_name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.badge_name && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {errors.badge_name}
              </span>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="points_required"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Points Required
            </label>
            <input
              type="number"
              id="points_required"
              name="points_required"
              value={formData.points_required}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {errors.points_required && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {errors.points_required}
              </span>
            )}
          </div>

          <button
            type="submit"
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
            disabled={loading}  // Disable the button when loading
            >
              {loading ? "Adding..." : "Add Badge"} {/* Show loading text */}
            </button>
  
        </form>
      </div>
    </div>
  );
};

export default AddBadge;
