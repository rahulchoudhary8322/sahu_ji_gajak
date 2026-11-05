import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/ScrollAnimation.css';

const TOTAL_FRAMES = 269;
const CONCURRENT_DOWNLOAD_LIMIT = 16;

export default function ScrollAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Array(TOTAL_FRAMES));
  const mobileImgRef = useRef(null);
  const trunkUpImgRef = useRef(null);
  const logoImgRef = useRef(null);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const lastRenderedIndexRef = useRef(-1);
  const hasRenderedInitialRef = useRef(false);

  const [loadProgress, setLoadProgress] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Helper to format frame filename
  const getFrameSrc = (index) => {
    const frameNum = String(index + 1).padStart(3, '0');
    return `/frames/ezgif-frame-${frameNum}.jpg`;
  };

  // Preload dedicated full-screen mobile elephant artworks & royal crest
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Walking elephant pose (front view)
    const mImg = new Image();
    mImg.onload = () => {
      mobileImgRef.current = mImg;
      if (window.innerWidth <= 768) {
        renderFrame(0);
      }
    };
    mImg.src = '/assets/royal-elephant-mobile.jpg';
    if (mImg.complete && mImg.naturalWidth > 0) {
      mobileImgRef.current = mImg;
    }

    // 2. Trunk-up royal salute pose (front view)
    const tImg = new Image();
    tImg.onload = () => {
      trunkUpImgRef.current = tImg;
    };
    tImg.src = '/assets/royal-elephant-trunk-up.jpg';
    if (tImg.complete && tImg.naturalWidth > 0) {
      trunkUpImgRef.current = tImg;
    }

    // 3. 3D Royal Gold Logo badge
    const crest = new Image();
    crest.onload = () => {
      logoImgRef.current = crest;
    };
    crest.src = '/assets/royal-logo-badge.png';
    if (crest.complete && crest.naturalWidth > 0) {
      logoImgRef.current = crest;
    }
  }, []);

  // Render a specific frame on the canvas with cover sizing
  const renderFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasWidth = canvas.clientWidth || window.innerWidth;
    const canvasHeight = canvas.clientHeight || window.innerHeight;

    const actualWidth = Math.round(canvasWidth * dpr);
    const actualHeight = Math.round(canvasHeight * dpr);

    if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
      canvas.width = actualWidth;
      canvas.height = actualHeight;
    }

    const isPortraitMobile = canvasWidth <= 768 || (canvasWidth / canvasHeight < 1.0);

    // =========================================================================
    // 1. MOBILE PHONE: DEDICATED FULL-SCREEN FRONT-FACING ROYAL ELEPHANT
    //    Elephant walks forward on scroll, raises trunk at end, then logo appears!
    // =========================================================================
    if (isPortraitMobile) {
      const mImg = mobileImgRef.current;
      const tImg = trunkUpImgRef.current;

      if (!mImg || !mImg.complete || mImg.naturalWidth === 0) {
        ctx.fillStyle = '#120202';
        ctx.fillRect(0, 0, actualWidth, actualHeight);
        return false;
      }

      // Base cover scale on mobile (ZERO black bars, ZERO double layers!)
      const baseScale = Math.max(actualWidth / mImg.naturalWidth, actualHeight / mImg.naturalHeight);

      // Current smooth scroll progress from 0 to 1
      const progress = Math.min(1, Math.max(0, currentFrameRef.current / (TOTAL_FRAMES - 1)));

      // --- A. WALKING GAIT & FORWARD STEP ADVANCE (Progress 0.0 to 0.70) ---
      // Realistic rhythmic weight shifting (left/right footstep sway + vertical step lift)
      const walkFactor = Math.min(1, progress / 0.70);
      const walkCycle = walkFactor * 12 * Math.PI;
      // Gently settle walking sway as elephant plants feet to raise trunk
      const gaitDampen = Math.max(0, 1 - Math.max(0, (progress - 0.62) / 0.08));
      const swayX = Math.sin(walkCycle) * (6 * dpr) * gaitDampen;
      const bobY = Math.abs(Math.sin(walkCycle * 2)) * (4.5 * dpr) * gaitDampen;

      // Elephant approaches forward along the red carpet directly toward patron
      const zoom = 1.0 + progress * 0.40;
      const scale = baseScale * zoom;

      const drawW = Math.round(mImg.naturalWidth * scale);
      const drawH = Math.round(mImg.naturalHeight * scale);
      const drawX = Math.round((actualWidth - drawW) / 2) + Math.round(swayX);

      // Smooth focal camera tracking onto the elephant's ornate forehead & golden tusks
      const focalYRatio = 0.52 - progress * 0.05;
      const drawY = Math.round(actualHeight * 0.5 - (mImg.naturalHeight * focalYRatio) * scale) + Math.round(bobY);

      // --- B. TRUNK RAISED SALUTE (Progress 0.68 to 1.0) ---
      // At the climax of the walk, the elephant proudly raises its trunk high in royal salute!
      let saluteAlpha = 0;
      if (progress >= 0.68 && tImg?.complete && tImg.naturalWidth > 0) {
        saluteAlpha = Math.min(1, (progress - 0.68) / 0.12);
      }

      // Draw walking pose (fading out as trunk raises)
      if (saluteAlpha < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - saluteAlpha;
        ctx.drawImage(mImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // Draw trunk-raised royal salute pose
      if (saluteAlpha > 0 && tImg) {
        ctx.save();
        ctx.globalAlpha = saluteAlpha;
        ctx.drawImage(tImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // --- C. CELEBRATORY RADIANCE & GOLDEN SUNBURST (When trunk raises) ---
      if (progress > 0.65) {
        const auraProgress = (progress - 0.65) / 0.35;
        const glowAlpha = Math.min(0.32, auraProgress * 0.42);
        const radialGlow = ctx.createRadialGradient(
          actualWidth / 2,
          actualHeight * 0.38,
          actualWidth * 0.08,
          actualWidth / 2,
          actualHeight * 0.45,
          actualWidth * 0.85
        );
        radialGlow.addColorStop(0, `rgba(255, 225, 130, ${glowAlpha})`);
        radialGlow.addColorStop(0.45, `rgba(212, 163, 61, ${glowAlpha * 0.55})`);
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, actualWidth, actualHeight);
      }

      // --- D. IMPERIAL "SAHU JI GAJAK" LOGO REVEAL (Progress 0.80 to 1.0) ---
      // Right as the trunk is raised up high in royal salute, the 3D gold logo appears!
      if (progress > 0.80 && logoImgRef.current?.complete) {
        const logoProgress = Math.min(1, (progress - 0.80) / 0.18);
        const logoImg = logoImgRef.current;
        const logoTargetW = Math.min(actualWidth * 0.74, 340 * dpr);
        const logoTargetH = logoTargetW * (logoImg.naturalHeight / logoImg.naturalWidth);
        const logoScale = 0.84 + logoProgress * 0.16;
        const finalW = logoTargetW * logoScale;
        const finalH = logoTargetH * logoScale;
        const logoX = (actualWidth - finalW) / 2;
        const logoY = actualHeight * 0.46 - finalH / 2;

        ctx.save();
        ctx.globalAlpha = Math.min(1, logoProgress * 1.35);
        ctx.shadowColor = 'rgba(212, 163, 61, 0.95)';
        ctx.shadowBlur = 30 * dpr;
        ctx.drawImage(logoImg, logoX, logoY, finalW, finalH);
        ctx.restore();
      }

      lastRenderedIndexRef.current = frameIndex;
      hasRenderedInitialRef.current = true;
      return true;
    }

    // =========================================================================
    // 2. LAPTOP / DESKTOP: 100% ORIGINAL 269-FRAME SEQUENCE (UNTOUCHED!)
    // =========================================================================
    // Retrieve target image or nearest loaded fallback
    let img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Find nearest loaded frame backward
      for (let i = frameIndex - 1; i >= 0; i--) {
        if (imagesRef.current[i]?.complete && imagesRef.current[i].naturalWidth > 0) {
          img = imagesRef.current[i];
          break;
        }
      }
      // If none backward, look forward
      if (!img) {
        for (let i = frameIndex + 1; i < TOTAL_FRAMES; i++) {
          if (imagesRef.current[i]?.complete && imagesRef.current[i].naturalWidth > 0) {
            img = imagesRef.current[i];
            break;
          }
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      return false;
    }

    // Desktop landscape: pure original cover calculation without modification
    const scale = Math.max(actualWidth / 1920, actualHeight / 1080);
    const drawW = 1920 * scale;
    const drawH = 1080 * scale;
    const drawX = (actualWidth - drawW) / 2;
    const drawY = (actualHeight - drawH) / 2;

    ctx.drawImage(
      img,
      Math.round(drawX),
      Math.round(drawY),
      Math.round(drawW),
      Math.round(drawH)
    );

    lastRenderedIndexRef.current = frameIndex;
    hasRenderedInitialRef.current = true;
    return true;
  }, []);

  // Preloading sequence
  useEffect(() => {
    let isCancelled = false;
    let loadedCount = 0;

    // 1. Instantly preload Frame 001 for zero-wait display
    const firstImg = new Image();
    firstImg.onload = () => {
      imagesRef.current[0] = firstImg;
      loadedCount++;
      renderFrame(0);
    };
    firstImg.onerror = () => {
      console.error('Failed to load initial frame 001');
    };
    firstImg.src = getFrameSrc(0);

    // If already cached in browser memory, render immediately
    if (firstImg.complete && firstImg.naturalWidth > 0) {
      imagesRef.current[0] = firstImg;
      renderFrame(0);
    }

    // 2. Queue remaining 268 frames with concurrent worker pool
    let currentIndex = 1;
    let activeWorkers = 0;

    const loadNext = () => {
      if (isCancelled) return;

      while (activeWorkers < CONCURRENT_DOWNLOAD_LIMIT && currentIndex < TOTAL_FRAMES) {
        const indexToLoad = currentIndex++;
        activeWorkers++;

        const img = new Image();
        const onFinished = () => {
          activeWorkers--;
          if (isCancelled) return;
          imagesRef.current[indexToLoad] = img;
          loadedCount++;
          const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          setLoadProgress(percent);

          // If current target frame or initial frame just finished, paint immediately
          if (!hasRenderedInitialRef.current || Math.round(currentFrameRef.current) === indexToLoad) {
            renderFrame(Math.round(currentFrameRef.current));
          }

          if (loadedCount >= TOTAL_FRAMES) {
            setAllLoaded(true);
          } else {
            loadNext();
          }
        };

        img.onload = onFinished;
        img.onerror = () => {
          console.warn(`Frame ${indexToLoad + 1} load failed, continuing`);
          onFinished();
        };
        img.src = getFrameSrc(indexToLoad);

        if (img.complete && img.naturalWidth > 0) {
          onFinished();
        }
      }
    };

    // Kick off worker pool
    loadNext();

    return () => {
      isCancelled = true;
    };
  }, [renderFrame]);

  // Priority loader for frames near active scroll position
  const prioritizeFrame = useCallback((index) => {
    if (index < 0 || index >= TOTAL_FRAMES) return;
    if (imagesRef.current[index]) return; // already loading or loaded

    const img = new Image();
    img.onload = () => {
      imagesRef.current[index] = img;
      if (Math.round(currentFrameRef.current) === index) {
        renderFrame(index);
      }
    };
    img.onerror = () => {};
    img.src = getFrameSrc(index);
    imagesRef.current[index] = img;
  }, [renderFrame]);

  // Handle scroll position & compute target frame
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.min(1, Math.max(0, scrolled / totalScrollable));
      const targetIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1))));

      targetFrameRef.current = targetIndex;
      setScrollProgress(progress);

      // Eagerly prioritize frames surrounding current scroll target
      for (let offset = -3; offset <= 5; offset++) {
        prioritizeFrame(targetIndex + offset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [prioritizeFrame]);

  // Animation render loop with smooth interpolation
  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      const target = targetFrameRef.current;
      const current = currentFrameRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.04) {
        currentFrameRef.current += diff * 0.25;
        const roundedIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(currentFrameRef.current)));
        if (roundedIndex !== lastRenderedIndexRef.current) {
          renderFrame(roundedIndex);
        }
      } else if (current !== target) {
        currentFrameRef.current = target;
        if (target !== lastRenderedIndexRef.current) {
          renderFrame(target);
        }
      } else if (!hasRenderedInitialRef.current) {
        // Guarantee frame 001 gets painted as soon as it's ready even if user hasn't scrolled
        renderFrame(0);
      }

      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const index = Math.round(currentFrameRef.current);
      renderFrame(index);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderFrame]);

  return (
    <section className="hero-scroll-container" ref={containerRef} id="home">
      <div className="canvas-sticky-viewport">
        {/* Main Canvas rendering 1920x1080 sequential frames */}
        <canvas ref={canvasRef} className="hero-animation-canvas" />

        {/* Subtle Ambient Palace Vignette */}
        <div className="royal-vignette-overlay" aria-hidden="true" />

        {/* Preloading HUD / Progress Bar */}
        {!allLoaded && (
          <div className="royal-loader-hud" role="status" aria-label="Loading royal darbar sequence">
            <div className="loader-inner-badge">
              <div className="loader-crown-icon">
                <svg viewBox="0 0 40 24" fill="none">
                  <path d="M4 20 L8 8 L15 14 L20 4 L25 14 L32 8 L36 20 Z" fill="#F5C65B" stroke="#FFE49E" strokeWidth="1" />
                  <circle cx="20" cy="3" r="2" fill="#FFE49E" />
                  <circle cx="8" cy="7" r="1.5" fill="#E53935" />
                  <circle cx="32" cy="7" r="1.5" fill="#E53935" />
                </svg>
              </div>
              <div className="loader-label">Preparing Imperial Darbar</div>
              <div className="loader-bar-track">
                <div className="loader-bar-fill" style={{ width: `${loadProgress}%` }} />
              </div>
              <div className="loader-stats">{loadProgress}% Sequence Ready</div>
            </div>
          </div>
        )}

        {/* Initial Scroll Prompt (Visible on first arrival) */}
        <div className={`scroll-prompt-wrapper ${scrollProgress > 0.08 ? 'faded' : ''}`}>
          <div className="scroll-prompt-pill">
            <span className="scroll-sparkle">✦</span>
            <span className="scroll-prompt-text">Scroll Down to Enter the Royal Darbar</span>
            <span className="scroll-sparkle">✦</span>
          </div>
          <div className="scroll-chevron-bounce">
            <svg viewBox="0 0 24 24" fill="none" className="chevron-svg">
              <path d="M7 10L12 15L17 10" stroke="#F5C65B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Scroll Progress Indicator Bar at Bottom Viewport */}
        <div className="scroll-progress-line-track">
          <div
            className="scroll-progress-line-fill"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
