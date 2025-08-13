import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const PeerGroupsDetailsPage = () => {
  const [searchParams] = useSearchParams(); // Correctly destructure useSearchParams
  const peerGroupId = searchParams.get("id"); // Extract the `id` parameter from URL
  console.log("peerGroupId", peerGroupId);

  const navigate = useNavigate();

  const [peerGroup, setPeerGroup] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!peerGroupId) return; // Ensure peerGroupId is available

    const fetchPeerGroupDetails = async () => {
      try {
        const response = await fetch(`/api/single-peer-groups?peer_group_id=${peerGroupId}`); // Correct query param
        const result = await response.json();

        if (response.ok) {
          setPeerGroup(result.data); // Access `data` field from the response
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError("Failed to fetch peer group details.");
      }
    };

    fetchPeerGroupDetails();
  }, [peerGroupId]);

  if (error) return <div className="text-red-500">{error}</div>;
  // if (!peerGroup) return <div>Loading peer group details...</div>;
  if (!peerGroup) return <><ProgressBar data={peerGroup} /></>;
  return (
    <div className="pl-12">
      <button onClick={() => navigate(-1)} className="text-gray-500 cursor-pointer bg-gray-200 hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md">
                <FaArrowLeftLong size={13} />
            </button>
      <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg flex gap-2 flex-col items-left">
        <h2 className="text-2xl font-bold mb-4 text-center mb-2" style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "7px" }}>
          Peer Group Details
        </h2>

        <p><strong>Peer Group Name:</strong> {peerGroup.name}</p>
        <p><strong>Peer Group Description:</strong> {peerGroup.description}</p>
      </div>
    </div>
  );
};

export default PeerGroupsDetailsPage;
