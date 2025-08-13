import React, { useState, useEffect } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import ProgressBar from "../components/ProgressBar";

const PeerGroupsEdit = () => {
  const [peerGroupName, setPeerGroupName] = useState("");
  const [peerGroupDescription, setPeerGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get peer group ID from the URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const peerGroupId = searchParams.get("id");

  useEffect(() => {
    // Fetch peer group details if peerGroupId exists
    const fetchPeerGroupDetails = async () => {
      if (peerGroupId) {
        try {
          const response = await fetch(`/api/single-peer-groups?peer_group_id=${peerGroupId}`);
          const data = await response.json();

          if (response.ok) {
            setPeerGroupName(data?.data?.name);
            setPeerGroupDescription(data?.data?.description);
          } else {
            toast.error(data.message || "Failed to fetch peer group details");
          }
        } catch (error) {
          console.error("Error fetching peer group details:", error);
          toast.error("Error fetching peer group details");
        }
      }
    };

    fetchPeerGroupDetails();
  }, [peerGroupId]);

  const handleUpdatePeerGroup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/update-peer-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: peerGroupName,
          description: peerGroupDescription,
          group_id: peerGroupId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Peer group updated successfully!", { autoClose: 2000 });
        navigate("/peer_groups"); // Navigate back to the peer groups list page
      } else {
        toast.error(result.message || "Failed to update peer group.", { autoClose: 2000 });
      }
    } catch (error) {
      console.error("Error updating peer group:", error);
      toast.error("Error updating peer group.");
    } finally {
      setLoading(false);
    }
  };
  if (!peerGroupName) return <><ProgressBar data={peerGroupName} /></>;
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
          Edit Peer Group
        </h2>
        <form onSubmit={handleUpdatePeerGroup}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="peer_group_name"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Peer Group Name
            </label>
            <input
              type="text"
              id="peer_group_name"
              value={peerGroupName}
              onChange={(e) => setPeerGroupName(e.target.value)}
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
              htmlFor="peer_group_description"
              style={{
                display: "block",
                fontSize: "14px",
                color: "#555",
                marginBottom: "5px",
              }}
            >
              Peer Group Description
            </label>
            <textarea
              id="peer_group_description"
              value={peerGroupDescription}
              onChange={(e) => setPeerGroupDescription(e.target.value)}
              required
              rows="5"
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
            {loading ? "Updating..." : "Update Peer Group"}
          </button>
        </form>
      </div>
    </div>

  );
};

export default PeerGroupsEdit;
