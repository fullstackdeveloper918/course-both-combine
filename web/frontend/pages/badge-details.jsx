import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import ProgressBar from "../components/ProgressBar";

const BadgeDetails = () => {
  const [searchParams] = useSearchParams();
  const badgeId = searchParams.get("id");
  console.log("badgeId", badgeId);

  const navigate = useNavigate();

  const [badge, setBadge] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!badgeId) return;

    const fetchBadgeDetails = async () => {
      try {
        const response = await fetch(`/api/single-badges?badges_id=${badgeId}`);
        const result = await response.json();

        if (response.ok) {
          setBadge(result.data);
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError("Failed to fetch badge details.");
      }
    };

    fetchBadgeDetails();
  }, [badgeId]);

  if (error) return <div className="text-red-500">{error}</div>;
  // if (!badge) return <div>Loading badge details...</div>;
  if (!badge) return <><ProgressBar data={badge} /></>;

  return (
    <div className="pl-12">
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 bg-gray-200 cursor-pointer hover:text-gray-700 hover:bg-gray-400 px-2 py-2 mt-4 rounded-md"
      >
        <FaArrowLeftLong size={13} />
      </button>
      <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg flex gap-2 flex-col items-left">
        <h2
          className="text-2xl font-bold mb-4 text-center"
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "7px" }}
        >
          Badge Details
        </h2>

        <p>
          <strong>Name:</strong> {badge.badge_name}
        </p>
        <p>
          <strong>Points Required:</strong> {badge.points_required}
        </p>
      </div>
    </div>
  );
};

export default BadgeDetails;
