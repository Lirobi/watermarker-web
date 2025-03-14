"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import Draggable, { DraggableProps, DraggableCore } from "react-draggable";
import Image from "next/image";

// Create a wrapper component to fix the findDOMNode issue
const DraggableWrapper = forwardRef<HTMLDivElement, DraggableProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    return (
      <div ref={ref} style={{ position: "absolute" }}>
        <DraggableCore {...rest}>
          <div>{children}</div>
        </DraggableCore>
      </div>
    );
  },
);
DraggableWrapper.displayName = "DraggableWrapper";

interface WatermarkEditorProps {
  mediaType: "image" | "video";
  mediaSrc: string;
  watermarkType: "text" | "image";
  watermarkContent: string;
  watermarkImageSrc?: string;
  opacity: number;
  scale: number;
  rotation: number;
  position?: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export default function WatermarkEditor({
  mediaType,
  mediaSrc,
  watermarkType,
  watermarkContent,
  watermarkImageSrc,
  opacity,
  scale,
  rotation,
  position: externalPosition,
  onPositionChange,
}: WatermarkEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [snapLines, setSnapLines] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  const [isSnapping, setIsSnapping] = useState({ x: false, y: false });

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update internal position when external position changes
  useEffect(() => {
    if (externalPosition && JSON.stringify(externalPosition) !== JSON.stringify(position)) {
      setPosition(externalPosition);
    }
  }, [externalPosition]);

  // Calculate container size on mount and resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });

        // Calculate snap lines (center, thirds, quarters)
        const xLines = [
          0, // left
          width / 4, // first quarter
          width / 3, // first third
          width / 2, // center
          (width / 3) * 2, // second third
          (width / 4) * 3, // third quarter
          width, // right
        ];

        const yLines = [
          0, // top
          height / 4, // first quarter
          height / 3, // first third
          height / 2, // center
          (height / 3) * 2, // second third
          (height / 4) * 3, // third quarter
          height, // bottom
        ];

        setSnapLines({ x: xLines, y: yLines });
      }
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);

    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, []);

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && mediaType === "video") {
      // Only set the src if it's different from the current src
      if (videoElement.src !== mediaSrc) {
        videoElement.src = mediaSrc;
      }

      // Add a timeout to check if the video loaded correctly
      const timeoutId = setTimeout(() => {
        if (videoElement.readyState === 0) {
          // Try setting the source again
          videoElement.src = mediaSrc;
        }
      }, 2000);

      // Set up fullscreen change detection
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
        clearTimeout(timeoutId);
      };
    }
  }, [mediaType, mediaSrc]);

  // Video control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.readyState < 2) {
          // Set up a one-time event listener for when the video can play
          const canPlayHandler = () => {
            videoRef.current
              ?.play()
              .then(() =>
                setIsPlaying(true),
              )
              .catch((e) => {
                // Handle autoplay restrictions
                if (e.name === "NotAllowedError") {
                  alert(
                    "Video playback was blocked by your browser. Please interact with the video player first.",
                  );
                } else {
                  // Try to reset the video source
                  videoRef.current!.src = mediaSrc;

                  // Try playing again after a short delay
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current
                        .play()
                        .then(() =>
                          setIsPlaying(true),
                        )
                        .catch((e) => {
                          // console.error("Still failed to play after reset:", e);
                        });
                    }
                  }, 500);
                }
              });

            // Remove the event listener
            videoRef.current?.removeEventListener("canplay", canPlayHandler);
          };

          videoRef.current.addEventListener("canplay", canPlayHandler);

          // Also try to load the video
          if (videoRef.current.src !== mediaSrc) {
            videoRef.current.src = mediaSrc;
          }

          return;
        }

        // Use the play promise to catch any errors
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              // Handle autoplay restrictions
              if (error.name === "NotAllowedError") {
                alert(
                  "Video playback was blocked by your browser. Please interact with the video player first.",
                );
              } else {
                // console.error("Video play error details:", error.message);

                // Try to reset the video source
                videoRef.current!.src = mediaSrc;

                // Try playing again after a short delay
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current
                      .play()
                      .then(() =>
                        setIsPlaying(true),
                      )
                      .catch((e) => {
                        // console.error("Still failed to play after reset:", e);
                      });
                  }
                }, 500);
              }
            });
        }
      }
    } else {
      // console.error("Video reference is not available");
      return;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newVolume = parseFloat(e.target.value);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);

      // If volume is set to 0, mute the video
      if (newVolume === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
      // If volume is increased from 0 and was muted, unmute
      else if (isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`,
          );
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle drag events
  const handleDrag = (e: any, data: { x: number; y: number }) => {
    setIsDragging(true);

    // Check for snap to guidelines
    const snapThreshold = 10;
    let newX = data.x + position.x;
    let newY = data.y + position.y;
    let isSnappingX = false;
    let isSnappingY = false;

    // Check X snap lines
    for (const line of snapLines.x) {
      if (Math.abs(newX - line) < snapThreshold) {
        newX = line;
        isSnappingX = true;
        break;
      }
    }

    // Check Y snap lines
    for (const line of snapLines.y) {
      if (Math.abs(newY - line) < snapThreshold) {
        newY = line;
        isSnappingY = true;
        break;
      }
    }

    setIsSnapping({ x: isSnappingX, y: isSnappingY });

    // Update position and notify parent
    const newPosition = { x: newX, y: newY };
    setPosition(newPosition);

    // Notify parent of position change
    if (onPositionChange && typeof onPositionChange === "function") {
      onPositionChange(newPosition);
    }
  };

  // Handle drag stop
  const handleDragStop = () => {
    setIsDragging(false);
    setIsSnapping({ x: false, y: false });

    // Notify parent of final position
    if (onPositionChange && typeof onPositionChange === "function") {
      onPositionChange(position);
    }
  };

  // Render watermark content
  const renderWatermark = () => {
    const watermarkStyle = {
      opacity: opacity / 100,
      transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
      transformOrigin: "center center",
      position: "absolute" as const,
      left: `${position.x}px`,
      top: `${position.y}px`,
      translate: "-50% -50%", // Center the watermark at the position point
    };

    if (watermarkType === "text") {
      return (
        <div
          ref={watermarkRef}
          className="text-white font-bold text-shadow select-none pointer-events-auto cursor-move text-nowrap"
          style={{
            ...watermarkStyle,
            fontSize: `${Math.max(16, 48 * (scale / 100))}px`,
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
          }}
        >
          {watermarkContent}
        </div>
      );
    } else if (watermarkType === "image" && watermarkImageSrc) {
      return (
        <div
          ref={watermarkRef}
          className="relative pointer-events-auto cursor-move"
          style={{
            ...watermarkStyle,
            width: `${Math.max(50, 200 * (scale / 100))}px`,
            height: `${Math.max(50, 200 * (scale / 100))}px`,
          }}
        >
          <Image
            src={watermarkImageSrc}
            alt="Watermark"
            fill
            style={{ objectFit: "contain" }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"
    >
      {/* Media content */}
      {mediaType === "image" ? (
        <Image
          src={mediaSrc}
          alt="Media"
          fill
          style={{ objectFit: "contain" }}
        />
      ) : (
        <div className="relative w-full h-full">
          <video
            key={mediaSrc}
            ref={videoRef}
            className="w-full h-full object-contain"
            controls={false}
            data-testid="video-element"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            playsInline
            preload="auto"
            autoPlay={false}
            loop={false}
            muted={isMuted}
            src={mediaSrc}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
            onLoadStart={() => {
            }}
            onCanPlay={() => {
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onPlay={() => {
              setIsPlaying(true);
            }}
            onPause={() => {
              setIsPlaying(false);
            }}
            onEnded={() => {
              setIsPlaying(false);
            }}
            onError={(e) => {
              if (videoRef.current) {
                // console.error("Video error:", e);
                // console.error("Video source:", mediaSrc);
                // console.error("Video element:", videoRef.current);
                // console.error("Video error code:", videoRef.current.error?.code);
                // console.error("Video error message:", videoRef.current.error?.message);
              }
            }}
          >
            {/* Add track element for accessibility */}
            <track kind="captions" src="" label="English" />
          </video>

          {/* Custom video controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 transition-opacity duration-300 ${isDragging ? "opacity-0" : "opacity-100"}`}
          >
            {/* Progress bar */}
            <div className="flex items-center mb-2">
              <span className="text-white text-xs mr-2">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={handleSeek}
                className="flex-grow h-1 bg-gray-400 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #9ca3af ${(currentTime / (duration || 1)) * 100}%, #9ca3af 100%)`,
                }}
              />
              <span className="text-white text-xs ml-2">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>

                <div className="flex items-center ml-2">
                  <button
                    onClick={toggleMute}
                    className="text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 ml-1 bg-gray-400 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snap guidelines */}
      {isDragging && (
        <>
          {isSnapping.x && (
            <div
              className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none"
              style={{ left: `${position.x}px` }}
            />
          )}
          {isSnapping.y && (
            <div
              className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none"
              style={{ top: `${position.y}px` }}
            />
          )}
        </>
      )}

      {/* Custom draggable watermark implementation */}
      <div
        className="absolute inset-0"
        role="button"
        tabIndex={0}
        aria-label="Drag watermark area"
        onKeyDown={(e) => {
          // Handle keyboard navigation for accessibility
          if (e.key === "Enter" || e.key === " ") {
            // Simulate click on Enter or Space
            e.preventDefault();
          }
        }}
        onMouseDown={(e) => {
          if (
            watermarkRef.current &&
            watermarkRef.current.contains(e.target as Node)
          ) {
            setIsDragging(true);

            const startX = e.clientX;
            const startY = e.clientY;
            const startPosX = position.x;
            const startPosY = position.y;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;

              const newX = startPosX + deltaX;
              const newY = startPosY + deltaY;

              // Apply snap logic
              let snappedX = newX;
              let snappedY = newY;
              let isSnappingX = false;
              let isSnappingY = false;

              const snapThreshold = 10;

              // Check X snap lines
              for (const line of snapLines.x) {
                if (Math.abs(newX - line) < snapThreshold) {
                  snappedX = line;
                  isSnappingX = true;
                  break;
                }
              }

              // Check Y snap lines
              for (const line of snapLines.y) {
                if (Math.abs(newY - line) < snapThreshold) {
                  snappedY = line;
                  isSnappingY = true;
                  break;
                }
              }

              setIsSnapping({ x: isSnappingX, y: isSnappingY });
              setPosition({
                x: Math.max(0, Math.min(containerSize.width, snappedX)),
                y: Math.max(0, Math.min(containerSize.height, snappedY)),
              });
            };

            const handleMouseUp = () => {
              setIsDragging(false);
              setIsSnapping({ x: false, y: false });
              onPositionChange(position);

              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }
        }}
      >
        {renderWatermark()}
      </div>
    </div>
  );
}
