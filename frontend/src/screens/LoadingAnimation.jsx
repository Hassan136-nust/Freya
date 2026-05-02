import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [frameState, setFrameState] = useState({ frame: 0, nextFrame: 0, opacity: 0, showButton: false });
  const [showIntro, setShowIntro] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const navigate = useNavigate();

  const totalFrames = 82; // Updated to 82 frames
  const frameProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastOpacityRef = useRef(0);

  const fullText = 'WELCOME to FREYA';

  // Typing animation
  useEffect(() => {
    if (!showIntro) return;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // Immediately hide intro - no wait
        setShowIntro(false);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [showIntro]);

  // Preload all images with error handling
  useEffect(() => {
    let loaded = 0;
    let failed = 0;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded + failed === totalFrames) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        failed++;
        console.warn(`Failed to load frame ${i}`);
        if (loaded + failed === totalFrames) {
          setImagesLoaded(true); // Continue even if some images fail
        }
      };
      img.src = `/animations/animate_in_cinamtic_style_202605021652_${String(i).padStart(3, '0')}.png`;
    }
  }, []);

  // Smooth animation loop with momentum - optimized
  useEffect(() => {
    if (!imagesLoaded || showIntro) return;

    let lastUpdateTime = Date.now();
    const targetFPS = 30; // Reduced from 60 for deployed stability
    const frameTime = 1000 / targetFPS;
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      const now = Date.now();
      
      // Only update if enough time has passed for next frame
      if (now - lastUpdateTime >= frameTime) {
        try {
          // Calculate velocity for ultra-smooth momentum
          const diff = targetProgressRef.current - frameProgressRef.current;
          frameProgressRef.current += diff * 0.08;

          // Ensure bounds
          frameProgressRef.current = Math.max(0, Math.min(totalFrames - 1, frameProgressRef.current));

          // Get integer frame and blend amount
          const floorFrame = Math.floor(frameProgressRef.current);
          const blendAmount = frameProgressRef.current - floorFrame;

          // Calculate frame numbers (0 to 81)
          const frame1 = Math.max(0, Math.min(totalFrames - 1, floorFrame));
          const frame2 = Math.max(0, Math.min(totalFrames - 1, floorFrame + 1));
          const showBtn = frameProgressRef.current >= totalFrames - 1.5;

          // Only update state if values actually changed
          if (frame1 !== lastFrameRef.current || Math.abs(blendAmount - lastOpacityRef.current) > 0.02 || showBtn !== frameState.showButton) {
            lastFrameRef.current = frame1;
            lastOpacityRef.current = blendAmount;
            setFrameState({ frame: frame1, nextFrame: frame2, opacity: blendAmount, showButton: showBtn });
          }

          lastUpdateTime = now;
        } catch (error) {
          console.error('Animation error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imagesLoaded, showIntro]);

  // Handle scroll with smooth momentum
  useEffect(() => {
    if (!imagesLoaded || showIntro) return;

    let touchStartY = 0;
    let touchEndY = 0;
    let isScrolling = false;

    const handleWheel = (e) => {
      if (isScrolling) return;
      e.preventDefault();

      // Higher sensitivity for faster scrolling
      const sensitivity = 0.008;
      targetProgressRef.current += e.deltaY * sensitivity;

      // Clamp between 0 and totalFrames-1 with safety bounds
      targetProgressRef.current = Math.max(0, Math.min(totalFrames - 1, targetProgressRef.current));
      frameProgressRef.current = Math.max(0, Math.min(totalFrames - 1, frameProgressRef.current));
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
      isScrolling = true;
    };

    const handleTouchMove = (e) => {
      if (!isScrolling) return;
      e.preventDefault();
      touchEndY = e.touches[0].clientY;
      
      // Calculate swipe distance
      const swipeDistance = touchStartY - touchEndY;
      
      // Sensitivity for touch
      const touchSensitivity = 0.015;
      targetProgressRef.current += swipeDistance * touchSensitivity;

      // Clamp between 0 and totalFrames-1 with safety bounds
      targetProgressRef.current = Math.max(0, Math.min(totalFrames - 1, targetProgressRef.current));
      frameProgressRef.current = Math.max(0, Math.min(totalFrames - 1, frameProgressRef.current));
      
      // Reset for next touch move
      touchStartY = touchEndY;
    };

    const handleTouchEnd = () => {
      touchStartY = 0;
      touchEndY = 0;
      isScrolling = false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [imagesLoaded, showIntro]);

  return (
    <div className="animation-container" ref={containerRef}>
      {/* Intro with Typing Animation */}
      {showIntro && (
        <div className="intro-overlay">
          {/* Falling particles */}
          <div className="intro-particles">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={`intro-particle-${i}`}
                className="intro-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>

          {/* Typing Text */}
          <div className="typing-container">
            <p className="typing-text">{displayedText}</p>
            <span className="typing-cursor"></span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`content-wrapper ${imagesLoaded && !showIntro ? 'loaded' : ''}`}>
        {/* Image display with smooth blending */}
        <div className="image-container">
          {/* Current frame */}
          <div className="image-display current">
            <img
              src={`/animations/animate_in_cinamtic_style_202605021652_${String(frameState.frame).padStart(3, '0')}.png`}
              alt={`Frame ${frameState.frame}`}
              draggable="false"
              className="frame-image"
            />
            <div className="image-glow"></div>
          </div>

          {/* Next frame - blended on top */}
          {frameState.opacity > 0 && (
            <div className="image-display next" style={{ opacity: frameState.opacity }}>
              <img
                src={`/animations/animate_in_cinamtic_style_202605021652_${String(frameState.nextFrame).padStart(3, '0')}.png`}
                alt={`Frame ${frameState.nextFrame}`}
                draggable="false"
                className="frame-image"
              />
              <div className="image-glow"></div>
            </div>
          )}

          {/* Code overlay */}
          <div className="code-overlay">
            <div className="code-box">
              <span className="code-text">
                {frameState.frame < 20 && '// Welcome to FREYA'}
                {frameState.frame >= 20 && frameState.frame < 40 && '<AI /> Powered'}
                {frameState.frame >= 40 && frameState.frame < 60 && 'const collaborate = true'}
                {frameState.frame >= 60 && frameState.frame < 80 && '// Real-time editing'}
                {frameState.frame >= 80 && '// Start building'}
              </span>
            </div>
          </div>
        </div>

        {/* Button overlay */}
        <div className={`button-overlay ${frameState.showButton ? 'show' : ''}`}>
          <div className="button-wrapper">
            
            <button 
              className="cta-button"
              onClick={() => navigate('/home')}
            >
              Start Coding
              <span className="button-glow"></span>
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className={`scroll-hint ${imagesLoaded && !frameState.showButton && !showIntro ? 'show' : ''}`}>
          <div className="hint-arrow"></div>
          <p>Scroll to explore</p>
        </div>

        {/* Frame counter */}
        <div className={`frame-counter ${imagesLoaded && !showIntro ? 'show' : ''}`}>
          <span>{frameState.frame}</span> / <span>{totalFrames - 1}</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
};

export default LoadingAnimation;
