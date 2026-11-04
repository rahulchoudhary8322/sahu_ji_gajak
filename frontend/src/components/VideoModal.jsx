import React, { useRef, useState, useEffect } from 'react';
import '../styles/VideoModal.css';

/**
 * Royal Video Player Modal
 * Plays actual MP4 video files with royal golden borders, curved corners,
 * Rajasthan corner brackets, and dynamic rotation support (0°, 90°, 180°, 270°).
 * Adapts container gracefully between portrait reel mode and widescreen landscape mode.
 */
export default function VideoModal({ video, onClose }) {
  if (!video) return null;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [rotation, setRotation] = useState(video.initialRotation || 0);

  // Sync rotation and play state whenever the selected video changes
  useEffect(() => {
    setRotation(video.initialRotation || 0);
    setIsPlaying(true);
  }, [video]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, rotation]);

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

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLandscape = rotation === 90 || rotation === 270;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div 
        className={`video-modal-container ${isLandscape ? 'mode-landscape' : 'mode-portrait'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="video-modal-header">
          <div className="video-header-info">
            <span className="video-header-badge">✦ Artisan Craftsmanship</span>
            <h3 className="video-modal-title">{video.title}</h3>
            {video.subtitle && <p className="video-modal-sub">{video.subtitle}</p>}
          </div>

          <div className="video-header-actions">
            {/* Quick Rotate Button in Header */}
            <button 
              className="video-header-rotate-btn" 
              onClick={handleRotate} 
              title="Rotate Video 90° (Shortcut: R)"
              aria-label="Rotate Video"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rotate-icon-svg">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.04 6.55 2.73L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <span>Rotate ({rotation}°)</span>
            </button>

            {/* Close Button */}
            <button className="video-modal-close-btn" onClick={onClose} aria-label="Close Video">
              ✕
            </button>
          </div>
        </div>

        {/* Video Player Frame with Royal Corners */}
        <div className={`video-player-frame ${isLandscape ? 'frame-landscape' : 'frame-portrait'}`}>
          {/* Rajasthani Ornamental Corner Accents */}
          <span className="player-corner corner-tl" aria-hidden="true" />
          <span className="player-corner corner-tr" aria-hidden="true" />
          <span className="player-corner corner-bl" aria-hidden="true" />
          <span className="player-corner corner-br" aria-hidden="true" />

          {/* Video Element with responsive transform */}
          <video
            ref={videoRef}
            src={video.src}
            className={isLandscape ? 'video-element-landscape' : 'video-element-portrait'}
            style={{
              transform: isLandscape 
                ? `translate(-50%, -50%) rotate(${rotation}deg)` 
                : (rotation ? `rotate(${rotation}deg)` : undefined)
            }}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Center Play/Pause indicator on click */}
          {!isPlaying && (
            <div className="video-paused-overlay" onClick={togglePlay}>
              <div className="paused-play-icon">
                <svg viewBox="0 0 24 24" fill="#FFE49E">
                  <path d="M8 5V19L19 12L8 5Z" />
                </svg>
              </div>
            </div>
          )}

          {/* Custom Controls Bar */}
          <div className="video-custom-controls">
            {/* Progress Seekbar */}
            <div className="video-seekbar-track" onClick={handleSeek}>
              <div className="video-seekbar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="video-controls-row">
              <div className="controls-left">
                {/* Play / Pause */}
                <button className="ctrl-btn" onClick={togglePlay} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5V19L19 12L8 5Z" />
                    </svg>
                  )}
                </button>

                {/* Mute / Unmute */}
                <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                  {isMuted ? '🔇' : '🔊'}
                </button>

                {/* Time Display */}
                <span className="ctrl-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="controls-right">
                {/* Rotate In Controls */}
                <button 
                  className="ctrl-btn ctrl-rotate-btn" 
                  onClick={handleRotate} 
                  title="Rotate 90° (R)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.04 6.55 2.73L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  <span className="ctrl-rotate-pill">{rotation}°</span>
                </button>

                {/* Fullscreen */}
                <button className="ctrl-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
