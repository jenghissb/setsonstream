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
  { label: '20f', value: 20 },
  { label: '16f', value: 16 },
  { label: '12f', value: 12 },
  { label: '10f', value: 10 },
  { label: '8f', value: 8 },
  { label: '4f', value: 4 }
];

const cloudName = "dmajy6owm";
const charNames = ["mario","donkeykong","link","samus","darksamus","yoshi","kirby","fox","pikachu","luigi","ness","captainfalcon","jigglypuff","peach","daisy","bowser","iceclimbers","sheik","zelda","drmario","pichu","falco","marth","lucina","younglink","ganondorf","mewtwo","roy","chrom","gnw","metaknight","pit","darkpit","zss","wario","snake","ike","squirtle","ivysaur","charizard","diddykong","lucas","sonic","kingdedede","olimar","lucario","rob","toonlink","wolf","villager","megaman","wiifittrainer","rosalina","littlemac","greninja","palutena","pacman","robin","shulk","bowserjr","duckhunt","ryu","ken","cloud","corrin","bayonetta","inkling","ridley","simon","richter","kingkrool","isabelle","incineroar","plant","joker","hero","banjo","terry","byleth","minmin","steve","sephiroth","pyra","mythra","kazuya","sora","miibrawler","miisword","miigunner"];
const optionNames = ["rollNotBlue","normalGetupNotBlue", "jumpNotBlue","getupAttackNotBlue"];
const optionDisplayNames = ["Roll","Normal Getup", "Jump","Getup Attack"];

const TOTAL_SETS = charNames.length;   
const EXTRA_PAUSE_FRAMES = 4; 

export default function LedgeOptions() {
  const [currentSetIndex, setCurrentSetIndex] = useState(0); 
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(SPEED_OPTIONS[0]); 
  const [loopLimit, setLoopLimit] = useState('all'); 
  const [isAssetLoading, setIsAssetLoading] = useState(true);

  const [variantsOrder, setVariantsOrder] = useState([0, 1, 2, 3]);
  const [activeVariants, setActiveVariants] = useState([0, 1, 2, 3]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, incorrect: 0 });
  const [quizTargetVariant, setQuizTargetVariant] = useState(null);

  const displayCanvasRefs = useRef([]);
  const preRenderedFrames = useRef([[], [], [], []]);
  
  const frameIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animationFrameId = useRef(null);
  const lastFrameTime = useRef(0);
  const targetFpsRef = useRef(60);
  const isAssetLoadingRef = useRef(true);
  
  const loopLimitRef = useRef('all'); 
  const currentMaxFramesRef = useRef(34);
  const pauseFrameCounterRef = useRef(0);

  const isQuizModeRef = useRef(false)
  const quizCanvasRef = useRef(null);
  const quizAnimFrameId = useRef(null);
  const quizFrameIndexRef = useRef(0);
  const quizLastFrameTime = useRef(0);
  const quizTimeoutRef = useRef(null);
  
  const targetVariantRef = useRef(null);

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
    if (isAssetLoadingRef.current || isQuizMode) return; 
    if (isPlayingRef.current) {
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
    if (isPlaying && !isQuizMode) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      lastFrameTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(playTick);
    }
  };

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
    isAssetLoadingRef.current = true;
    setIsAssetLoading(true);

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
        
        if (loadedCount === optionNames.length) {
          isAssetLoadingRef.current = false;
          setIsAssetLoading(false);
          if (isQuizMode) {
            setupNextQuizQuestion();
          } else {
            playAfterSwitch();
          }
        }
      };
    });
  }, [currentSetIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (quizAnimFrameId.current) cancelAnimationFrame(quizAnimFrameId.current);
      if (quizTimeoutRef.current) clearTimeout(quizTimeoutRef.current);
    };
  }, []);

  const stopQuizPlayback = () => {
    if (quizAnimFrameId.current) cancelAnimationFrame(quizAnimFrameId.current);
    if (quizTimeoutRef.current) clearTimeout(quizTimeoutRef.current);
  };

  const setupNextQuizQuestion = () => {
    stopQuizPlayback();
    if (isAssetLoadingRef.current || activeVariants.length === 0) return;

    const randomIndex = Math.floor(Math.random() * activeVariants.length);
    const chosenVariant = activeVariants[randomIndex];
    
    targetVariantRef.current = chosenVariant;
    setQuizTargetVariant(chosenVariant);

    replayQuizAnimation();
  };

  const replayQuizAnimation = () => {
    stopQuizPlayback();
    if (targetVariantRef.current === null) return;

    quizFrameIndexRef.current = -1;

    const canvas = quizCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const delay = Math.floor(Math.random() * 301) + 300;
    quizTimeoutRef.current = setTimeout(() => {
      quizLastFrameTime.current = performance.now();
      quizAnimFrameId.current = requestAnimationFrame(quizPlayTick);
    }, delay);
  };

  const quizPlayTick = (timestamp) => {
    const frameInterval = 1000 / targetFpsRef.current;
    const elapsed = timestamp - quizLastFrameTime.current;

    if (elapsed >= frameInterval) {
      const currentMax = currentMaxFramesRef.current;
      let boundaryFrame = currentMax - 1;
      if (loopLimitRef.current !== 'all') {
        boundaryFrame = Math.min(loopLimitRef.current - 1, currentMax - 1);
      }

      if (quizFrameIndexRef.current < boundaryFrame) {
        quizFrameIndexRef.current += 1;
        
        const canvas = quizCanvasRef.current;
        const bakedCanvas = preRenderedFrames.current[targetVariantRef.current]?.[quizFrameIndexRef.current];
        if (canvas && bakedCanvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bakedCanvas, 0, 0);
        }
        quizLastFrameTime.current = timestamp - (elapsed % frameInterval);
        quizAnimFrameId.current = requestAnimationFrame(quizPlayTick);
      } else {
        const canvas = quizCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        stopQuizPlayback();
      }
    } else {
      quizAnimFrameId.current = requestAnimationFrame(quizPlayTick);
    }
  };

  const handleQuizAnswer = (variantIdx) => {
    if (variantIdx === targetVariantRef.current) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setQuizScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
    setupNextQuizQuestion();
  };

  const handleQuizReset = () => {
    setQuizScore({ correct: 0, incorrect: 0 });
    setupNextQuizQuestion();
  };

  const handleToggleQuizMode = () => {
    if (isQuizModeRef.current) {
      stopQuizPlayback();
      targetVariantRef.current = null;
      setQuizTargetVariant(null);
      isQuizModeRef.current = false
      setIsQuizMode(false);
      setTimeout(() => playAfterSwitch(), 50);
    } else {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      }
      isQuizModeRef.current = true
      setIsQuizMode(true);
      setTimeout(() => setupNextQuizQuestion(), 50);
    }
  };

  const handleNextFrame = () => {
    if (isAssetLoadingRef.current || isQuizMode) return;
    if (isPlayingRef.current) togglePlay();
    if (frameIndexRef.current < currentMaxFramesRef.current - 1) {
      frameIndexRef.current += 1;
      setCurrentFrameIndex(frameIndexRef.current);
      updateAllDisplays(frameIndexRef.current);
    }
  };

  const handlePrevFrame = () => {
    if (isAssetLoadingRef.current || isQuizMode) return;
    if (isPlayingRef.current) togglePlay();
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

  useEffect(() => {
    const ignoreElemTypes = ["text", "textarea", "email"];
    const ignorePress = () => {

      const activeElemType = document.activeElement.type;
      if (activeElemType && ignoreElemTypes.includes(activeElemType)) {
        return true;
      }
      return false;
    };
    const keyFun = function(e) {
      const isQuiz = isQuizModeRef.current
      if (!isQuiz && e.key === 'ArrowLeft' && !ignorePress()) {
        e.preventDefault();
        handlePrevFrame();
      } else if (!isQuiz && e.key === 'ArrowRight' && !ignorePress()) {
        e.preventDefault();
        handleNextFrame();
      } else if (e.key === ',' && !ignorePress()) {
        e.preventDefault();
        handlePrevSet();
      } else if (e.key === '.' && !ignorePress()) {
        e.preventDefault();
        handleNextSet();
      } else if (e.key === ' ' && !ignorePress()) {
        e.preventDefault();
        if (isQuiz == true) {
          console.log("path 1")
          replayQuizAnimation()
        } else {
          console.log("path 2")
          togglePlay();
        }
      } else if (e.key === 'q' && !ignorePress()) {
        e.preventDefault();
        handleToggleQuizMode();
      }

    };
    document.addEventListener('keydown', keyFun);
    return () => {
      document.removeEventListener('keydown', keyFun);
    };
  }, [isQuizMode, currentSetIndex]);

  const handleCharacterDropdownChange = (e) => {
    setCurrentSetIndex(parseInt(e.target.value, 10));
  };

  const toggleVisibility = (index) => {
    if (activeVariants.includes(index)) {
      if (activeVariants.length === 1) return;
      setActiveVariants(activeVariants.filter(vIdx => vIdx !== index));
    } else {
      setActiveVariants([...activeVariants, index]);
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
  
  const containerRef = useRef(null);

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

  const renderedVariants = variantsOrder.filter(idx => activeVariants.includes(idx));
  const title = "Ledge Option Animation Comparisons";
  const description = "Compare Ledge Option Animations for Smash Ultimate";

  const totalAnswers = quizScore.correct + quizScore.incorrect;
  const successPercent = totalAnswers > 0 ? Math.round((quizScore.correct / totalAnswers) * 100) : 0;

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

      {showFilterDrawer && (
        <div className="filter-reorder-drawer">
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
            const cleanLabel = optionDisplayNames[variantIdx];

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

      <div className="wrapper-container">
        
          <div className="sprite-grid-container" style={{ opacity: isAssetLoading ? 0.8 : 1 }}>
          {
            renderedVariants.map((variantIdx) => {
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
            })
          }
          </div>
         {isQuizMode && 
          <div className="quiz-overlay-view">
            <div className="quiz-global-overlay-box">
              <button className="quiz-close-x" onClick={handleToggleQuizMode} title="Close Quiz Mode">
                &times;
              </button>
              
              <div className="quiz-info-column">
                <div className="quiz-info-stat">Score: <span className="quiz-stat-val">{successPercent}%</span></div>
                <div className="quiz-info-stat-sub">Correct: <span className="quiz-stat-val-sub">{quizScore.correct}</span></div>
                <div className="quiz-info-stat-sub">Incorrect: <span className="quiz-stat-val-sub">{quizScore.incorrect}</span></div>
              </div>

              <div className="quiz-center-viewport">
                <div className="quiz-canvas-card">
                  <canvas 
                    ref={quizCanvasRef}
                    className="sprite-canvas"
                    width={FRAME_WIDTH}
                    height={FRAME_HEIGHT}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <div className="control-console horizontal-scroll-layout">
        
        {!isQuizMode ? (
          <div className="control-button-group">
            <button onClick={handlePrevSet} disabled={currentSetIndex === 0} className="btn btn-ctrl" title="Previous Character">«</button>
            <button onClick={handlePrevFrame} disabled={(currentFrameIndex === 0 && !isPlaying) || isAssetLoading} className="btn btn-ctrl" title="Previous Frame">‹</button>
            <button onClick={togglePlay} disabled={isAssetLoading} className={`btn btn-ctrl btn-play ${isPlaying ? 'playing' : ''}`} title={isPlaying ? "Pause" : "Play"}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={handleNextFrame} disabled={(currentFrameIndex === currentMaxFramesRef.current - 1 && !isPlaying) || isAssetLoading} className="btn btn-ctrl" title="Next Frame">›</button>
            <button onClick={handleNextSet} disabled={currentSetIndex === TOTAL_SETS - 1} className="btn btn-ctrl" title="Next Character">»</button>
          </div>
        ) : (
          <div className="control-button-group quiz-action-group">
            {activeVariants.map((variantIdx) => (
              <button 
                key={variantIdx} 
                onClick={() => handleQuizAnswer(variantIdx)} 
                className="btn btn-ctrl quiz-buttons-btn quiz-guess-btn"
              >
                {optionDisplayNames[variantIdx]}
              </button>
            ))}            
            <button onClick={replayQuizAnimation} className="btn btn-ctrl quiz-buttons-btn quiz-replay-btn" title="Replay Animation">Replay 🔁</button>
            <button onClick={handleQuizReset} className="btn btn-ctrl quiz-buttons-btn quiz-reset-btn" title="Reset Quiz Progress">Reset</button>
          </div>
        )}

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
            <svg width="18px" height="18px" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 15H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 22H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <button onClick={toggleFullscreen} className="btn btn-ctrl btn-fullscreen" title="Toggle Fullscreen">
            ⛶
          </button>

          <button 
            onClick={handleToggleQuizMode} 
            className={`btn btn-ctrl btn-quiz-toggle ${isQuizMode ? 'quiz-active' : ''}`} 
            title="Toggle Quiz Mode"
          >
            🎓 Quiz
          </button>
        </div>
      </div>
    </div>
  );
}