import React, { useState, useEffect } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ProgressBar from "../components/ProgressBar";

const BadgeEdit = () => {
  const [badgeName, setBadgeName] = useState("");
  const [pointRequired, setPointRequired] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get badge ID from the URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const badgeId = searchParams.get("id");

  useEffect(() => {
    // Fetch badge details if badgeId exists
    const fetchBadgeDetails = async () => {
      if (badgeId) {
        try {
          const response = await fetch(`/api/single-badges?badges_id=${badgeId}`);
          const data = await response.json();

          if (response.ok) {
            setBadgeName(data?.data?.badge_name);
            setPointRequired(data?.data?.points_required);
          } else {
            toast.error(data.message || "Failed to fetch badge details");
          }
        } catch (error) {
          console.error("Error fetching badge details:", error);
          toast.error("Error fetching badge details");
        }
      }
    };

    fetchBadgeDetails();
  }, [badgeId]);

  const handleUpdateBadge = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/update-badges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          badge_name: badgeName,
          points_required: pointRequired,
          badge_id: badgeId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Badge updated successfully!", { autoClose: 2000 });
        navigate("/badges"); // Navigate back to the badges list page
      } else {
        toast.error(result.message || "Failed to update badge.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error updating badge:", error);
      toast.error("Error updating badge.");
    } finally {
      setLoading(false);
    }
  };

   if (!badgeName) return <><ProgressBar data={badgeName} /></>;

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
          Edit Badge
        </h2>
        <form onSubmit={handleUpdateBadge}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="badgeName"
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
              id="badgeName"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
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
              htmlFor="pointRequired"
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
              id="pointRequired"
              value={pointRequired}
              onChange={(e) => setPointRequired(e.target.value)}
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
            {loading ? "Updating..." : "Update Badge"}
          </button>
        </form>
      </div>
    </div>

  );
};

export default BadgeEdit;
