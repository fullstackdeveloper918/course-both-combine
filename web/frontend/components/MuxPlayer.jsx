// components/MuxPlayer.jsx
"use client";
import React from "react";
import MuxPlayer from "@mux/mux-player-react";

const MuxVideoPlayer = () => {
  return (
    <MuxPlayer
      playbackId="YOUR_PLAYBACK_ID"
      streamType="on-demand"
      autoPlay
      muted
      primaryColor="#FF0000"
      style={{ width: "100%", height: "500px" }}
    />
  );
};

export default MuxVideoPlayer;
