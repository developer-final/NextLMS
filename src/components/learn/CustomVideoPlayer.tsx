"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  RotateCw,
  Gauge,
  Sparkles,
} from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/utils";

interface CustomVideoPlayerProps {
  src: string;
  title?: string;
  lessonId?: string;
  poster?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function CustomVideoPlayer({
  src,
  title,
  lessonId,
  poster,
  autoPlay = false,
  onEnded,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [resumedTime, setResumedTime] = useState<number | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  // Check if the URL is a YouTube stream
  const isYouTube = Boolean(
    src && (src.includes("youtube.com") || src.includes("youtu.be"))
  );

  // Restore playback position from localStorage
  useEffect(() => {
    if (isYouTube || !lessonId || hasRestoredProgress) return;

    try {
      const saved = localStorage.getItem(`wtl_video_pos_${lessonId}`);
      if (saved) {
        const parsedTime = parseFloat(saved);
        if (parsedTime > 5) {
          setResumedTime(parsedTime);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [lessonId, isYouTube, hasRestoredProgress]);

  // Handle restoring video time when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current && resumedTime && !hasRestoredProgress) {
      if (resumedTime < videoRef.current.duration - 10) {
        videoRef.current.currentTime = resumedTime;
      }
      setHasRestoredProgress(true);
    }
  };

  // Save current playback progress periodically
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !lessonId) return;
    const current = videoRef.current.currentTime;
    try {
      // Save every few seconds
      localStorage.setItem(`wtl_video_pos_${lessonId}`, String(Math.floor(current)));
    } catch {
      // Ignore storage errors
    }
  }, [lessonId]);

  // Change Playback Speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Skip forward or backward
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard Shortcuts (Space, J/K/L, M, F)
  useEffect(() => {
    if (isYouTube) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        skipTime(-5);
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        skipTime(5);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isYouTube]);

  // If YouTube URL, render optimized responsive iframe
  if (isYouTube) {
    const embedUrl = getYouTubeEmbedUrl(src);
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
        <iframe
          src={embedUrl || ""}
          title={title || "Lesson Video"}
          className="h-full w-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // HTML5 S3 / CDN Video Player with LMS enhancements
  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl select-none"
      onContextMenu={(e) => e.preventDefault()} // Anti-piracy right-click lock
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        controls
        controlsList="nodownload"
        disablePictureInPicture={false}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        className="h-full w-full object-contain"
      />

      {/* Floating Control Badges (Top-Right overlay) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Playback Speed Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-brand-400 border border-slate-700/80 shadow-lg transition-colors"
            title="Tốc độ phát"
          >
            <Gauge className="h-3 w-3 text-brand-400" />
            <span>{playbackRate}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute right-0 mt-1.5 w-24 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md py-1 shadow-2xl z-20">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleSpeedChange(rate)}
                  className={`w-full text-left px-3 py-1 text-xs transition-colors ${
                    playbackRate === rate
                      ? "text-brand-400 font-bold bg-brand-500/10"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {rate}x {rate === 1 && "(Chuẩn)"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Skip Buttons */}
        <button
          type="button"
          onClick={() => skipTime(-5)}
          className="flex items-center rounded-lg bg-slate-950/80 backdrop-blur-md p-1.5 text-slate-300 hover:text-brand-400 border border-slate-700/80 shadow-lg transition-colors"
          title="Tua lùi 5 giây (Phím J hoặc ←)"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => skipTime(5)}
          className="flex items-center rounded-lg bg-slate-950/80 backdrop-blur-md p-1.5 text-slate-300 hover:text-brand-400 border border-slate-700/80 shadow-lg transition-colors"
          title="Tua tới 5 giây (Phím L hoặc →)"
        >
          <RotateCw className="h-3 w-3" />
        </button>
      </div>

      {/* Resumed Notification Badge */}
      {resumedTime && hasRestoredProgress && (
        <div className="absolute bottom-16 left-4 z-10 flex items-center gap-1.5 rounded-lg bg-slate-950/90 border border-brand-500/30 px-3 py-1.5 text-[11px] text-brand-400 backdrop-blur-md shadow-xl animate-fade-in pointer-events-none">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            Đã tiếp tục phát từ{" "}
            {Math.floor(resumedTime / 60)}:
            {String(Math.floor(resumedTime % 60)).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
