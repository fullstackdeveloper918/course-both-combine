import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextBlock,
  Button,
  Image,
  InlineStack,
  BlockStack,
  Badge,
  Heading,
} from "@shopify/ui-extensions-react/customer-account";

export function VideoModal({
  lesson,
  isOpen,
  onClose,
  onProgress,
  storeDomain,
  authenticatedCustomer,
  selectedCourse,
  selectedModule,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const modalRef = useRef(null);

  // Decode JWT token to get HLS URL
  const decodeVideoToken = (token) => {
    try {
      if (token && token.includes(".")) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        return decoded.url || token;
      }
      return token;
    } catch (error) {
      console.error("Error decoding video token:", error);
      return token;
    }
  };

  const loadHlsJs = () => {
    return new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.onload = () => {
        console.log("HLS.js loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.error("Failed to load HLS.js");
        reject(new Error("Failed to load HLS.js"));
      };
      document.head.appendChild(script);
    });
  };

  const initializeVideo = async () => {
    if (!lesson?.videoUrl || !videoRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const videoUrl = decodeVideoToken(lesson.videoUrl);
      console.log("Initializing video with URL:", videoUrl);

      // Dynamically load HLS.js if not already loaded
      if (!window.Hls) {
        await loadHlsJs();
      }

      const video = videoRef.current;

      // Setup video event listeners
      const handleCanPlay = () => {
        console.log("Video can play");
        setLoading(false);
        setVideoReady(true);
      };

      const handleError = (e) => {
        console.error("Video error:", e);
        setError("Failed to load video. Please try again.");
        setLoading(false);
      };

      const handleLoadedMetadata = () => {
        console.log("Video metadata loaded");
        setDuration(video.duration);
        setLoading(false);
        setVideoReady(true);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        if (onProgress && video.duration) {
          const progress = Math.floor(
            (video.currentTime / video.duration) * 100
          );
          onProgress(video.currentTime, progress);

          // Save progress to backend
          saveProgress(video.currentTime, progress);
        }
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolumeChange = () => setVolume(video.volume);

      // Add event listeners
      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", handleError);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("volumechange", handleVolumeChange);

      // Initialize HLS or native playback
      if (window.Hls && window.Hls.isSupported()) {
        console.log("Using HLS.js");

        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new window.Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS manifest parsed");
          setLoading(false);
          setVideoReady(true);
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
          if (data.fatal) {
            let errorMsg = "HLS streaming error occurred.";
            switch (data.type) {
              case window.Hls.ErrorTypes.NETWORK_ERROR:
                errorMsg =
                  "Network error loading video. Check your connection.";
                break;
              case window.Hls.ErrorTypes.MEDIA_ERROR:
                errorMsg =
                  "Media error occurred. Video format may be unsupported.";
                break;
            }
            setError(errorMsg);
            setLoading(false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        console.log("Using native HLS support");
        video.src = videoUrl;
      } else {
        setError("Your browser does not support HLS video streaming.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error initializing video:", err);
      setError("Failed to initialize video player.");
      setLoading(false);
    }
  };

  const saveProgress = async (currentTime, progress) => {
    if (!storeDomain || !authenticatedCustomer?.id || !lesson?.id) return;

    const data = {
      userId: authenticatedCustomer.id,
      lessonId: lesson.id,
      courseId: selectedCourse?.id,
      moduleId: selectedModule?.id,
      status: progress >= 90 ? "completed" : "in_progress",
      progress: progress,
      lastPosition: currentTime.toFixed(2),
    };

    try {
      const res = await fetch(`${storeDomain}/api/frontend/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) {
        console.warn("Failed to send progress update:", result.message);
      }
    } catch (err) {
      console.error("Progress save error:", err);
    }
  };

  const cleanup = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.load();
    }
    setVideoReady(false);
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const retryVideo = () => {
    cleanup();
    setTimeout(initializeVideo, 1000);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (seekTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (modalRef.current?.requestFullscreen) {
        modalRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            handleClose();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 10));
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, isPlaying, currentTime, duration, isFullscreen]);

  useEffect(() => {
    if (isOpen && lesson?.videoUrl) {
      initializeVideo();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen, lesson?.videoUrl]);

  if (!isOpen) return null;

  return (
    <View
      ref={modalRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: "1200px",
          backgroundColor: "#000",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          animation: "slideIn 0.4s ease-out",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: "16px 20px",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <InlineStack spacing="base" inlineAlignment="space-between">
            <BlockStack spacing="tight">
              <Heading size="medium" style={{ color: "white" }}>
                {lesson?.title}
              </Heading>
              {lesson?.description && (
                <TextBlock style={{ color: "#ccc", fontSize: "14px" }}>
                  {lesson.description}
                </TextBlock>
              )}
            </BlockStack>
            <Button onPress={handleClose} kind="plain">
              <TextBlock style={{ color: "white", fontSize: "24px" }}>
                ✕
              </TextBlock>
            </Button>
          </InlineStack>
        </View>

        {/* Video Container */}
        <View
          style={{
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#000",
            position: "relative",
            minHeight: "400px",
            "@media (max-width: 768px)": {
              minHeight: "250px",
            },
            "@media (max-width: 480px)": {
              minHeight: "200px",
            },
          }}
        >
          {loading && (
            <View
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                zIndex: 5,
              }}
            >
              <View
                style={{
                  width: "60px",
                  height: "60px",
                  border: "4px solid rgba(255,255,255,0.3)",
                  borderTop: "4px solid white",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                }}
                className="video-loading-spinner"
              />
              <TextBlock style={{ color: "white", fontSize: "16px" }}>
                Loading video...
              </TextBlock>
            </View>
          )}

          {error && (
            <View
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(20, 20, 20, 0.95)",
                color: "white",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
                maxWidth: "500px",
                zIndex: 10,
                animation: "slideIn 0.3s ease-out",
              }}
            >
              <TextBlock
                style={{
                  color: "#ff6b6b",
                  marginBottom: "20px",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                ⚠️ Video Error
              </TextBlock>
              <TextBlock
                style={{
                  marginBottom: "30px",
                  lineHeight: "1.6",
                  color: "#ccc",
                }}
              >
                {error}
              </TextBlock>
              <InlineStack spacing="base">
                <Button onPress={retryVideo} appearance="primary">
                  🔄 Retry
                </Button>
                <Button onPress={handleClose} appearance="secondary">
                  ✕ Close
                </Button>
              </InlineStack>
            </View>
          )}

          <video
            ref={videoRef}
            controls
            preload="metadata"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              outline: "none",
              display: videoReady && !error ? "block" : "none",
            }}
          >
            Your browser does not support video playback.
          </video>
        </View>

        {/* Footer with controls and info */}
        <View
          style={{
            padding: "16px 20px",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <InlineStack spacing="base" inlineAlignment="space-between">
            <InlineStack spacing="tight">
              {lesson?.duration && (
                <Badge tone="info">⏱️ {lesson.duration} min</Badge>
              )}
              <Badge tone="success">🎥 HLS Stream</Badge>
              {videoReady && duration > 0 && (
                <Badge tone="attention">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Badge>
              )}
            </InlineStack>

            <InlineStack spacing="tight">
              <Button onPress={toggleFullscreen} kind="secondary" size="small">
                {isFullscreen ? "🗗 Exit Fullscreen" : "🗖 Fullscreen"}
              </Button>
            </InlineStack>
          </InlineStack>

          <View style={{ marginTop: "12px" }}>
            <TextBlock style={{ color: "#888", fontSize: "12px" }}>
              💡 Keyboard shortcuts: Space (play/pause) • F (fullscreen) • ← →
              (seek) • Esc (close)
            </TextBlock>
          </View>
        </View>
      </View>
    </View>
  );
}

export default VideoModal;
