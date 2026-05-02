import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [frameState, setFrameState] = useState({ frame: 8, nextFrame: 8, opacity: 0, showButton: false });
  const [showIntro, setShowIntro] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const navigate = useNavigate();

  const totalFrames = 8;
  const frameProgressRef = useRef(0);
  const animationFrameRef = useRef(null);
  const targetProgressRef = useRef(0);
  const lastFrameRef = useRef(8);
  const lastOpacityRef = useRef(0);

  const fullText = 'WELCOME to FREYA\nAI Powered Coding Agent\nStart Coding Now';

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
        // Wait 2 seconds then hide intro
        setTimeout(() => setShowIntro(false), 2000);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [showIntro]);

  // Preload all images
  useEffect(() => {
    let loaded = 0;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === totalFrames) {
          setImagesLoaded(true);
        }
      };
      img.src = `/animations/frame_${String(i).padStart(4, '0')}.png`;
    }
  }, []);

  // Smooth animation loop with momentum - optimized
  useEffect(() => {
    if (!imagesLoaded || showIntro) return;

    const animate = () => {
      // Calculate velocity for ultra-smooth momentum
      const diff = targetProgressRef.current - frameProgressRef.current;
      frameProgressRef.current += diff * 0.08; // Smoother easing

      // Get integer frame and blend amount
      const floorFrame = Math.floor(frameProgressRef.current);
      const blendAmount = frameProgressRef.current - floorFrame;

      // Calculate frame numbers (8 down to 1)
      const frame1 = Math.max(1, 8 - floorFrame);
      const frame2 = Math.max(1, 8 - floorFrame - 1);
      const showBtn = frameProgressRef.current >= 6.95;

      // Only update state if values actually changed (smaller threshold for smoother transitions)
      if (frame1 !== lastFrameRef.current || Math.abs(blendAmount - lastOpacityRef.current) > 0.005 || showBtn !== frameState.showButton) {
        lastFrameRef.current = frame1;
        lastOpacityRef.current = blendAmount;
        setFrameState({ frame: frame1, nextFrame: frame2, opacity: blendAmount, showButton: showBtn });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
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

    const handleWheel = (e) => {
      e.preventDefault();

      // Higher sensitivity for more responsive cinematic feel
      const sensitivity = 0.0025;
      targetProgressRef.current += e.deltaY * sensitivity;

      // Clamp between 0 and 7
      targetProgressRef.current = Math.max(0, Math.min(7, targetProgressRef.current));
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      touchEndY = e.touches[0].clientY;
      
      // Calculate swipe distance
      const swipeDistance = touchStartY - touchEndY;
      
      // Sensitivity for touch (adjust as needed)
      const touchSensitivity = 0.008;
      targetProgressRef.current += swipeDistance * touchSensitivity;

      // Clamp between 0 and 7
      targetProgressRef.current = Math.max(0, Math.min(7, targetProgressRef.current));
      
      // Reset for next touch move
      touchStartY = touchEndY;
    };

    const handleTouchEnd = () => {
      touchStartY = 0;
      touchEndY = 0;
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
              src={`/animations/frame_${String(frameState.frame).padStart(4, '0')}.png`}
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
                src={`/animations/frame_${String(frameState.nextFrame).padStart(4, '0')}.png`}
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
                {frameState.frame === 1 && '// Start building'}
                {frameState.frame === 2 && 'const future = "now"'}
                {frameState.frame === 3 && '// Seamless workflow'}
                {frameState.frame === 4 && 'function innovate() {}'}
                {frameState.frame === 5 && '// Real-time editing'}
                {frameState.frame === 6 && 'const collaborate = true'}
                {frameState.frame === 7 && '<AI /> Powered'}
                {frameState.frame === 8 && '// Welcome to FREYA'}
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
          <span>{frameState.frame}</span> / <span>{totalFrames}</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="vignette"></div>
    </div>
  );
};

export default LoadingAnimation;
