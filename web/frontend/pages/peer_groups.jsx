import { useEffect, useState } from "react";
import {
  Page,
  Layout,
} from "@shopify/polaris";

import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import PeerGroupsTable from "../components/PeerGroupsTable";
import queryString from "query-string";

export default function PageName() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [peerGroups, setPeerGroups] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const { page = 1, search = "" } = queryString.parse(location.search);
    setCurrentPage(Number(page));
    setSearch(search);
  }, [location.search]);

  useEffect(() => {
    const fetchPeerGroups = async () => {
      try {
        const response = await fetch(`/api/get-peer-groups?page=${currentPage}&search=${search}`);
        const data = await response.json();
        setPeerGroups(data.data);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching peer groups:", error);
      }
    };

    fetchPeerGroups();
  }, [currentPage, search]);

  const handleAddPeerGroups = () => {
    navigate("/add-peer-groups");
  };

  const handlePageChange = ({ selected }) => {
    const newPage = selected + 1;
    const query = queryString.stringify({ page: newPage, search });
    navigate(`?${query}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = queryString.stringify({ page: 1, search });
    navigate(`?${query}`);
  };

  return (
    <div className="w-full">
        <div className="sticky w-full top-0 bg-[#f1f2f4] z-10 flex justify-between items-center py-4 px-8 shadow">
        <h1 className="text-2xl font-semibold" style={{ fontSize: "23px", fontWeight: "500" }}>Peer Groups</h1>
        <div className="flex items-center space-x-4">
        <form onSubmit={handleSearch} className="flex justify-end items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search peer groups..."
              className="px-2 py-1 border rounded w-80"
            />
          </form>
          <button onClick={handleAddPeerGroups} className="px-4 py-1 cursor-pointer bg-[#ffffff] text-black font-semibold  rounded-xl">Add Peer Groups</button>
        </div>
      </div>

          <PeerGroupsTable
            peerGroups={peerGroups}
            setPeerGroups={setPeerGroups}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
    </div>
  );
}
