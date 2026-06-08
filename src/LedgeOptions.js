import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from "react-helmet-async";
import './LedgeOptions.css';

const FRAME_WIDTH = 440;
const FRAME_HEIGHT = 880;
const COLS = 6;
const ROWS = 6;

const NUM_FRAMES_PER_CHAR = [34,34,34,32,32,33,33,34,32,34,34,34,32,32,34,34,34,34,34,34,34,34,34,34,32,33,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,31,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34,34];

const SPEED_OPTIONS = [
  { label: '1x', menuLabel: '1x (60 fps)', fps: 60 },
  { label: '1/2x', menuLabel: '1/2x (30 fps)', fps: 30 },
  { label: '1/3x', menuLabel: '1/3x (20 fps)', fps: 20 },
  { label: '1/4x', menuLabel: '1/4x (15 fps)', fps: 15 },
  { label: '1/5x', menuLabel: '1/5x (12 fps)', fps: 12 },
  { label: '1/6x', menuLabel: '1/6x (10 fps)', fps: 10 },
  { label: '1/8x', menuLabel: '1/8x (7.5 fps)', fps: 7.5 },
  { label: '1/10x', menuLabel: '1/10x (6 fps)', fps: 6 },
  { label: '1/20x', menuLabel: '1/20x (3 fps)', fps: 3 },
  { label: '1/30x', menuLabel: '1/30x (2 fps)', fps: 2 },
  { label: '1/60x', menuLabel: '1/60x (1 fps)', fps: 1 },
];

const LOOP_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: '12f', value: 12 },
  { label: '10f', value: 10 },
  { label: '8f', value: 8 },
  { label: '4f', value: 4 }
];

const cloudName = "dmajy6owm";
const charNames = ["mario","donkeykong","link","samus","darksamus","yoshi","kirby","fox","pikachu","luigi","ness","captainfalcon","jigglypuff","peach","daisy","bowser","iceclimbers","sheik","zelda","drmario","pichu","falco","marth","lucina","younglink","ganondorf","mewtwo","roy","chrom","gnw","metaknight","pit","darkpit","zss","wario","snake","ike","squirtle","ivysaur","charizard","diddykong","lucas","sonic","kingdedede","olimar","lucario","rob","toonlink","wolf","villager","megaman","wiifittrainer","rosalina","littlemac","greninja","palutena","pacman","robin","shulk","bowserjr","duckhunt","ryu","ken","cloud","corrin","bayonetta","inkling","ridley","simon","richter","kingkrool","isabelle","incineroar","plant","joker","hero","banjo","terry","byleth","minmin","steve","sephiroth","pyra","mythra","kazuya","sora","miibrawler","miisword","miigunner"];
const optionNames = ["rollNotBlue","normalGetupNotBlue", "jumpNotBlue","getupAttackNotBlue"];
const optionDisplayNames = ["Roll","Normal Getup", "Jump","Getup Attack"]
;

const TOTAL_SETS = charNames.length;   

// Set this to 0 now, and it will loop with absolutely zero interruption
const EXTRA_PAUSE_FRAMES = 4; 

export default function LedgeOptions() {
  const [currentSetIndex, setCurrentSetIndex] = useState(0); 
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(SPEED_OPTIONS[0]); 
  const [loopLimit, setLoopLimit] = useState('all'); 
  const [isAssetLoading, setIsAssetLoading] = useState(true); // Added loading state flag

// A simple array of indices representing the current sorting order
  const [variantsOrder, setVariantsOrder] = useState([0, 1, 2, 3]);
  const [activeVariants, setActiveVariants] = useState([0, 1, 2, 3]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const displayCanvasRefs = useRef([]);
  const preRenderedFrames = useRef([[], [], [], []]);
  
  const frameIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animationFrameId = useRef(null);
  const lastFrameTime = useRef(0);
  const targetFpsRef = useRef(60);
  
  const loopLimitRef = useRef('all'); 
  const currentMaxFramesRef = useRef(34);
  const pauseFrameCounterRef = useRef(0);

  const getOptionNameUrl = (charIndex, optionName) => {
    const charName = charNames[charIndex];
    return `https://res.cloudinary.com/${cloudName}/image/upload/ledgeoptions1/${charName}/${charName}_${optionName}.webp`;
  };

  const paintVisibleFrame = (variantIdx, frameIdx) => {
    const displayCanvas = displayCanvasRefs.current[variantIdx];
    const bakedCanvas = preRenderedFrames.current[variantIdx]?.[frameIdx];
    
    if (!displayCanvas || !bakedCanvas) return;
    
    const ctx = displayCanvas.getContext('2d');
    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    ctx.drawImage(bakedCanvas, 0, 0);
  };

  const updateAllDisplays = (frameIdx) => {
    optionNames.forEach((_, variantIdx) => {
      paintVisibleFrame(variantIdx, frameIdx);
    });
  };

  const playTick = (timestamp) => {
    if (!isPlayingRef.current) return;

    const frameInterval = 1000 / targetFpsRef.current;
    const elapsed = timestamp - lastFrameTime.current;

    if (elapsed >= frameInterval) {
      const currentMax = currentMaxFramesRef.current;
      
      let boundaryFrame = currentMax - 1;
      if (loopLimitRef.current !== 'all') {
        boundaryFrame = Math.min(loopLimitRef.current - 1, currentMax - 1);
      }

      // Check if we need to hold on the final loop frame
      if (frameIndexRef.current === boundaryFrame && EXTRA_PAUSE_FRAMES > 0) {
        if (pauseFrameCounterRef.current < EXTRA_PAUSE_FRAMES) {
          pauseFrameCounterRef.current += 1;
          lastFrameTime.current = timestamp - (elapsed % frameInterval);
          animationFrameId.current = requestAnimationFrame(playTick);
          return;
        } else {
          pauseFrameCounterRef.current = 0;
        }
      }

      if (frameIndexRef.current < boundaryFrame) {
        frameIndexRef.current += 1;
      } else {
        frameIndexRef.current = 0; 
      }

      setCurrentFrameIndex(frameIndexRef.current);
      updateAllDisplays(frameIndexRef.current);
      lastFrameTime.current = timestamp - (elapsed % frameInterval);
    }

    animationFrameId.current = requestAnimationFrame(playTick);
  };

  const togglePlay = () => {
    if (isAssetLoading) return; // Prevent playing empty setups
    if (isPlaying) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      lastFrameTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(playTick);
    }
  };

  const playAfterSwitch = () => {
    if (isPlaying) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      lastFrameTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(playTick);
    }
  }

  const handleSpeedChange = (e) => {
    const selectedIdx = e.target.value;
    const speedObj = SPEED_OPTIONS[selectedIdx];
    setCurrentSpeed(speedObj);
    targetFpsRef.current = speedObj.fps;
    lastFrameTime.current = performance.now();
  };

  const handleLoopChange = (e) => {
    const val = e.target.value;
    const parsedVal = val === 'all' ? 'all' : parseInt(val, 10);
    setLoopLimit(parsedVal);
    loopLimitRef.current = parsedVal;
  };

  useEffect(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsAssetLoading(true); // Signal asset download pipeline is processing

    const framesForThisChar = NUM_FRAMES_PER_CHAR[currentSetIndex] || 34;
    currentMaxFramesRef.current = framesForThisChar;

    frameIndexRef.current = 0;
    setCurrentFrameIndex(0);
    pauseFrameCounterRef.current = 0;

    preRenderedFrames.current = [[], [], [], []];
    let loadedCount = 0;

    optionNames.forEach((optionName, variantIdx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getOptionNameUrl(currentSetIndex, optionName);
      
      img.onload = () => {
        for (let f = 0; f < framesForThisChar; f++) {
          const col = f % COLS;
          const row = Math.floor(f / COLS);
          const sx = col * FRAME_WIDTH;
          const sy = row * FRAME_HEIGHT;

          const hiddenCanvas = document.createElement('canvas');
          hiddenCanvas.width = FRAME_WIDTH;
          hiddenCanvas.height = FRAME_HEIGHT;
          const hCtx = hiddenCanvas.getContext('2d');
          
          hCtx.drawImage(
            img, 
            sx, sy, FRAME_WIDTH, FRAME_HEIGHT, 
            0, 0, FRAME_WIDTH, FRAME_HEIGHT
          );

          preRenderedFrames.current[variantIdx][f] = hiddenCanvas;
        }
        
        paintVisibleFrame(variantIdx, 0);
        loadedCount += 1;
        
        // Flag setup complete only when all 4 option sets are baked in memory
        if (loadedCount === optionNames.length) {
          setIsAssetLoading(false);
          playAfterSwitch()
        }
        /////play
      };
    });
  }, [currentSetIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const handleNextFrame = () => {
    if (isAssetLoading) return;
    if (isPlaying) togglePlay(); 
    if (frameIndexRef.current < currentMaxFramesRef.current - 1) {
      frameIndexRef.current += 1;
      setCurrentFrameIndex(frameIndexRef.current);
      updateAllDisplays(frameIndexRef.current);
    }
  };

  const handlePrevFrame = () => {
    if (isAssetLoading) return;
    if (isPlaying) togglePlay();
    if (frameIndexRef.current > 0) {
      frameIndexRef.current -= 1;
      setCurrentFrameIndex(frameIndexRef.current);
      updateAllDisplays(frameIndexRef.current);
    }
  };

  const handleNextSet = () => {
    if (currentSetIndex < TOTAL_SETS - 1) {
      setCurrentSetIndex((prev) => prev + 1);
    }
  };

  const handlePrevSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex((prev) => prev - 1);
    }
  };

  const handleCharacterDropdownChange = (e) => {
    setCurrentSetIndex(parseInt(e.target.value, 10));
  };

// --- SIMPLIFIED FILTER & REORDER HANDLERS ---
const toggleVisibility = (index) => {
    if (activeVariants.includes(index)) {
      if (activeVariants.length === 1) return; // Always keep at least one checked
      setActiveVariants(activeVariants.filter(vIdx => vIdx !== index));
    } else {
      // 1. Unhide the requested variant by appending it to the active list array state
      setActiveVariants([...activeVariants, index]);

      // 2. THE REPAINT FIX: Escape the synchronous state cycle to allow the canvas DOM 
      // rendering tree node mount to conclude, then paint the active frame slice immediately.
      setTimeout(() => {
        paintVisibleFrame(index, frameIndexRef.current);
      }, 0);
    }
  };
  const moveVariant = (currentIndex, direction) => {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= variantsOrder.length) return;
    
    const updated = [...variantsOrder];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[nextIndex];
    updated[nextIndex] = temp;
    setVariantsOrder(updated);
  };
  
// 1. Add a container ref at the top of your component alongside your other refs
const containerRef = useRef(null);

// 2. Add this fullscreen handler inside your component
const toggleFullscreen = () => {
  if (!containerRef.current) return;

  if (!document.fullscreenElement) {
    containerRef.current.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

// Render the views based on the custom user sequence filtered by visibility
  const renderedVariants = variantsOrder.filter(idx => activeVariants.includes(idx));
  const title = "Ledge Option Animation Comparisons"
  const description = "Compare Ledge Option Animations for Smash Ultimate"

  return (
    <div className="viewer-container" ref={containerRef}>
      <Helmet>
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta name="twitter:title" content={title}/>
          <meta name="twitter:description" content={description}/>
      </Helmet>

      {isAssetLoading && (
        <div className="loading-overlay">
          Loading Character Frames...
        </div>
      )}

      {/* FILTER & REORDER CONFIGURATION DRAWER */}
      {showFilterDrawer && (
        <div className="filter-reorder-drawer">
          {/* ENHANCED HEADER: Includes an explicit close button mapped to the toggle state */}
          <div className="drawer-header">
            <span>Ledge options:</span>
            <button 
              className="btn-drawer-close" 
              onClick={() => setShowFilterDrawer(false)}
              title="Close Menu"
            >
              &times;
            </button>
          </div>
          {variantsOrder.map((variantIdx, currentIndex) => {
            const isVisible = activeVariants.includes(variantIdx);
            const cleanLabel = optionDisplayNames[variantIdx]

            return (
              <div key={variantIdx} className="drawer-item-row">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isVisible} 
                    disabled={isVisible && activeVariants.length === 1}
                    onChange={() => toggleVisibility(variantIdx)}
                  />
                  <span>{cleanLabel}</span>
                </label>
                <div className="reorder-btn-group">
                  <button onClick={() => moveVariant(currentIndex, -1)} disabled={currentIndex === 0} className="btn-sort">▲</button>
                  <button onClick={() => moveVariant(currentIndex, 1)} disabled={currentIndex === variantsOrder.length - 1} className="btn-sort">▼</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANIMATION VIEWPORT GRID CONTAINER */}
      <div className="sprite-grid-container" style={{ opacity: isAssetLoading ? 0.8 : 1 }}>
        {renderedVariants.map((variantIdx) => {
          const optionName = optionDisplayNames[variantIdx];

          return (
            <div key={variantIdx} className="sprite-card">
              <h4 className="variant-title-inset">
                {optionName ? optionName : `Variant ${variantIdx + 1}`}
              </h4>
              <canvas 
                ref={(el) => (displayCanvasRefs.current[variantIdx] = el)} 
                className="sprite-canvas"
                width={FRAME_WIDTH}
                height={FRAME_HEIGHT}
              />
            </div>
          );
        })}
      </div>

      {/* COMPACT HARDWARE CONTROL CONSOLE */}
      <div className="control-console horizontal-scroll-layout">
        <div className="control-button-group">
          <button onClick={handlePrevSet} disabled={currentSetIndex === 0} className="btn btn-ctrl" title="Previous Character">«</button>
          <button onClick={handlePrevFrame} disabled={(currentFrameIndex === 0 && !isPlaying) || isAssetLoading} className="btn btn-ctrl" title="Previous Frame">‹</button>
          <button onClick={togglePlay} disabled={isAssetLoading} className={`btn btn-ctrl btn-play ${isPlaying ? 'playing' : ''}`} title={isPlaying ? "Pause" : "Play"}>{isPlaying ? '⏸' : '▶'}</button>
          <button onClick={handleNextFrame} disabled={(currentFrameIndex === currentMaxFramesRef.current - 1 && !isPlaying) || isAssetLoading} className="btn btn-ctrl" title="Next Frame">›</button>
          <button onClick={handleNextSet} disabled={currentSetIndex === TOTAL_SETS - 1} className="btn btn-ctrl" title="Next Character">»</button>
        </div>

        <div className="control-dropdown-group">
          <div className="select-wrapper speed-select">
            <span className="select-btn-label">{currentSpeed.label}</span>
            <select value={SPEED_OPTIONS.indexOf(currentSpeed)} onChange={handleSpeedChange}>
              {SPEED_OPTIONS.map((opt, i) => <option key={i} value={i}>{opt.menuLabel}</option>)}
            </select>
          </div>

          <div className="select-wrapper loop-select">
            <span className="select-btn-label">🔁 {loopLimit === 'all' ? 'All' : `${loopLimit}f`}</span>
            <select value={loopLimit} onChange={handleLoopChange}>
              {LOOP_OPTIONS.map((opt, i) => <option key={i} value={opt.value}>🔁 {opt.label}</option>)}
            </select>
          </div>

          <div className="select-wrapper char-select">
            <span className="select-btn-label">{charNames[currentSetIndex]}</span>
            <select value={currentSetIndex} onChange={handleCharacterDropdownChange}>
              {charNames.map((name, idx) => <option key={name} value={idx}>{name}</option>)}
            </select>
          </div>

          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)} 
            className={`btn btn-ctrl btn-filter ${showFilterDrawer ? 'active' : ''}`}
            title="Configure Ledge Options"
          >
            {/* Modern 3-line descending filter vector */}
            <svg width="18px" height="18px" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 15H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 22H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

          </button>
          <button onClick={toggleFullscreen} className="btn btn-ctrl btn-fullscreen" title="Toggle Fullscreen">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}