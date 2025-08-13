// components/VideoPlayer.jsx
import React, { useRef } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = () => {
  const playerRef = useRef(null);

  const handlePause = () => {
    const currentTime = playerRef.current.getCurrentTime();
    console.log("Video paused at:", currentTime);

    // Example: send to backend
    fetch("/api/video-pause", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pausedAt: currentTime }),
    });
  };

  return (
    <div className="player-wrapper" style={{ position: "relative", paddingTop: "56.25%" }}>
      <ReactPlayer
        ref={playerRef}
        url="https://your-bunny-stream-url.m3u8" // Replace with your actual video URL
        controls
        playing={false}
        onPause={handlePause}
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0 }}
        config={{
          file: {
            attributes: {
              controlsList: "nodownload", // Prevent download icon
              onContextMenu: (e) => e.preventDefault(), // Block right-click
            },
          },
        }}
      />
    </div>
  );
};

export default VideoPlayer;
