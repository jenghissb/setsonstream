import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  { label: '14f', value: 14 },
  { label: '12f', value: 12 },
  { label: '10f', value: 10 },
  { label: '8f', value: 8 },
  { label: '4f', value: 4 }
];

const ledgeMotionIndicators = ["Hand out, Head up, Leg out on all","Head, feet","Legs","Arm tightens outward slightly","Arm tightens outward slightly","Head + nose move up f1","Feet","Feet","Tenses slightly head moves inward slightly","Head moves back, feet move in","Feet and head move up","Arm and body tense a little","Body, arm","Head, dress","Head, dress","Lengthens a bit","Feet positions change","Arm out, legs move","Arm moves a bit","Foot pushes down arms move","Head moves","Head and feet move","Head, sword, feet move","Head, sword, feet move","Feet, shield, ledge hand, head","Head moves up, feet move up","Feet, head, tail move","Head, sword, feet move","Head, sword, feet move","Nose and hand positions change and mouth may open.  Except for jump","Feet, hands","Feet","Feet","Arm, feet","Feet","Feet","Arm, head, feet","Tail, head","Head, bud","Head","Arm, feet","Head","Head, feet","Feet, head","Feet, head","Feet, head","Base, head","Feet, shield, head","Head, arm, feet","Head, feet","Head, feet","Feet","Head, dress","Feet","Head, knees, feet","Sceptre, head","Feet","Feet","Feet, Sword","Head, cart body","Head, feet, bird head","Feet","Feet","Head, feet, sword","Sword, feet, head","Feet","Feet, head","Head","Feet, head","Feet, head","Feet, head, arm","Head","Feet, head, arm","Head","Feet, knife, head","Feet","Hand, feet, head","Head, knees, feet","Head, feet","Elongated ledge arm, feet, head","Feet, arm","Feet, sword hilt","Feet, sword, head, arm","Feet, sword, head, arm","Arm, feet, head","Boots","Feet","Head, feet","Feet, gun, head"]
const optionSpeeds = [
["Medium","Medium","Slow","Slow","Slow","Medium","Fast","Slow","Slow","Medium","Fast","Slow","Fast","Medium","Medium","Slow","Slow","Slow","Fast","Medium","Fast","Medium","Slow","Slow","Slow","Slow","Medium","Slow","Slow","Slow","Slow","Slow","Slow","Slow","Slow","Slow","Medium","Medium","Fast","Fast","Medium","Fast","Slow","Medium","Slow","Fast","Medium","Slow","Medium","Medium","Slow","Medium","Fast","Fast","Medium","Medium","Slow","Medium","Fast","Medium","Medium","Fast","Fast","Medium","Medium","Fast","Slow","Fast","Slow","Slow","Fast","Medium","Fast","Medium","Medium","Fast","Fast","Medium","Medium","Slow","Fast","Medium","Medium","Medium","Medium","Slow","Slow","Slow","Medium"],
["Slow","Fast","Medium","Slow","Slow","Fast","Fast","Medium","Slow","Slow","Medium","Slow","Medium","Slow","Slow","Fast","Medium","Slow","Slow","Slow","Slow","Slow","Medium","Medium","Fast","Fast","Slow","Medium","Medium","Slow","Slow","Medium","Medium","Fast","Medium","Medium","Medium","Slow","Slow","Medium","Slow","Slow","Slow","Slow","Fast","Medium","Medium","Fast","Medium","Medium","Fast","Slow","Medium","Medium","Medium","Medium","Fast","Medium","Fast","Fast","Medium","Medium","Medium","Slow","Medium","Medium","Fast","Slow","Slow","Slow","Slow","Slow","Slow","Slow","Slow","Fast","Medium","Slow","Slow","Slow","Slow","Slow","Medium","Medium","Slow","Fast","Fast","Fast","Fast"],
["Fast","Slow","Fast","Fast","Fast","Medium","Medium","Fast","Medium","Fast","Slow","Fast","Slow","Fast","Fast","Medium","Fast","Medium","Medium","Fast","Fast","Fast","Fast","Fast","Medium","Fast","Fast","Fast","Fast","Slow","Fast","Slow","Slow","Medium","Fast","Fast","Fast","Fast","Medium","Fast","Fast","Slow","Fast","Fast","Medium","Slow","Fast","Medium","Fast","Medium","Medium","Fast","Slow","Slow","Medium","Fast","Medium","Fast","Slow","Medium","Fast","Medium","Medium","Fast","Fast","Slow","Medium","Medium","Medium","Medium","Medium","Medium","Medium","Slow","Fast","Medium","Slow","Fast","Fast","Fast","Slow","Fast","Fast","Fast","Slow","Medium","Slow","Slow","Slow"],
["Medium","Medium","Slow","Medium","Medium","Medium","Slow","Slow","Slow","Slow","Medium","Medium","Slow","Slow","Slow","Slow","Fast","Slow","Slow","Slow","Slow","Slow","Medium","Medium","Slow","Fast","Slow","Medium","Medium","Slow","Medium","Fast","Fast","Medium","Medium","Slow","Medium","Slow","Medium","Slow","Medium","Medium","Slow","Slow","Slow","Medium","Medium","Fast","Slow","Fast","Medium","Medium","Slow","Medium","Medium","Slow","Fast","Medium","Medium","Slow","Medium","Slow","Slow","Slow","Medium","Medium","Medium","Slow","Fast","Fast","Slow","Fast","Slow","Fast","Slow","Slow","Slow","Medium","Slow","Slow","Medium","Medium","Slow","Slow","Fast","Slow","Medium","Medium","Fast"]
]
const optionNotes = [
["Leg out slightly further","","Shield out f5-10","Roll slightly faster by f9","Roll slightly faster by f9","Nose/Head forward","Shifts down then up","Legs split tail stays down","","Leans neck back","","","Twists immediately","","","Head lowers, one foot rises","","","Velocity matches going over","","","","Holds sword out behind","Holds sword out behind","","","Torso rotates in","Holds sword out behind","Holds sword out behind","Mouth open, hand medium.  moves f8","","Wings are not part of anim","Wings are not part of anim","Gun hand out","Starts a frame earlier than the medium anims but goes slower","","Sword out briefly","Eyes half closed","","","","","","","","","Head faces forward","","","","","Legs swing back","","Knee rises over top","","Slightly faster than normal getup.  Sceptre up angled frame 11","","","Hands are slightly closer than normal getup maybe","","Starts moving in f9","","","","Moves a bit faster but dips first.  Sword downward angled","Turns parallel","Points gun up out","","Roll slightly faster","Roll slightly faster","","","","","Grabs ledge both hands","Roll slightly faster, moves in~f12","","Hand and knee out","Raises arm","","","Moves up f6. Sword down in -> down out","Sword in down slightly","Sword in down slightly","","Boots kick","","Holds sword down a while",""],
["Hand stays out longer","Feet move out slightly","Shield waved outwards frame 1, then up","","","Head/Nose angled back","Shifts out then up","Both legs and tail swing in z axis","Same as roll until about f13","Leans neck in","Back extends out.  Looks more forward","","","Torso pushes back a bit","","Rises f1","","","","","Hand and head rise briefly for 1f","","Turns parallel by f3","Turns parallel by f3","Pauses to prepare for handstand","Hand forward, pauses to stand up","Doesn't twist","Turns parallel by f3","Turns parallel by f3","Mouth open, Hand up, moves f17","","Pauses to pull self up, weapon away/on ledge from frame 5. Wings are not part of anim","Pauses to pull self up, weapon away/on ledge from frame 5","Pauses to pull self up","","Moves hand to help pull up","Pulls self up more f5-10","Waves hand out","","Holds arm out further","","Torso out to pull self up","","","Tilts head back","","Head tilts back and towards camera","Parallel within 3f.  Pauses to prepare handstand","Delay before head starts moving up","","Compresses into almost a ball","","Wand appears f7","Arm rises up and out","Begins high flip f8","","Brings arm up","","Rotates over faster starting f10.","","","Knee points up","Knee points up","Head/torso outward","Sword upward angled","Arcs over with gun","Doesn't hold gun, pauses while lifting self up","","","","","","","","","Scabbard angled a bit flatter","","Pulls up without arm.  Raises knee over starting f9","Grabs ledge with both hands f5","","Moves up f11 slowly","Moves up f9.  sword up in","Slightly faster. Sword down out","Slightly faster. Sword down out","Moves to grab ledge","Pauses to pull self up after ascent.  Boots travel upwards","Arm above","Sword above","Gun above"],
["Head rises faster","Compresses does not move, unique from f1","","","","Head up back slight more than roll","Stays in place and looks down briefly","Head and feet up","Faster is only diff","Leans neck very in","","Arm up and out f1","","","","Head lowers, hand moves to grab ledge, body twists parallel, legs are level","Shift up from f1 ","","Feet/legs go up","","Eyes open from f2","","","","","Faster from f5","Whole body rotates around ledge ","","","Mouth closed Hand up. nose in.  moves f13","","Wings are not part of anim","Wings are not part of anim","","","","Sword out and swings around","","Arm up f1","Raises wings to flap them f5+","","","","","","","","Holds shield out for a while","","","Holds arm out slightly more","","Luma stays in place","Leg moves outward","Begins flip f8","","Looks towards camera","Points toes.  Waits after initial faster ascent","Legs swing before ascent f9","Clown car stays facing out a little.  Head tilts back","Wing+bird up","","","","","Swings legs parallel","","","","","","","","","Rises quickly","Shield up and out","Hand stays out grabs slowly","","","","Moves up f9 quickly","Moves up f5.  Sword up out ","Sword down then sheaved f8.  Pauses after initial ascent","Sword down then sheaved f8.  Pauses after initial ascent","Stretches elbow out","Boots travel up and out","","",""],
["Same as normal except hand","Same as roll until f8","Shield out but turned the other way.  sword out f5. light f9","","","Head/Nose angled back","Stays in place briefly","Legs split tail stays down then shifts left f4+","Same as roll until about f13","Leans neck in","Back extends out.  Looks more up Back out further f5","","","","","Head moves in, feet stay level","Head tilts f1","","","","Hand and head rise briefly for 1f","","","","","Hand forward, pauses to stand up","Arm attack anim, tail turn away, f7 spark","","","Mouth open hand low.  moves f10","","Turns inward early.  Wings are not part of anim","Turns inward early.  Wings are not part of anim","pulls knees over ledge","","Just a bit slower than roll","","","","","","","f9 spark","","","f8 spark","Head protrudes forward","Looks towards camera a bit","Very delayed/slow start","","Turns parallel","Legs pull forward","","","","","","","Grabs sword f4","Twists inward in place","Bird mouth open.  f9 spark","Arm out to the side","Arm out to the side","","f7 spark","Arcs over with gun","Tenses gun down away","","","","","","","","Very slow looks idle","","","","Holds sword over ledge a while","","Has sword early","Moves up f5.  Head slightly forward.  Sword ready f8","Sword up f4.","Sword up f4.","","Moves out sword. f8 spark","Raises arm","","Extra fast"],
]
const speedBackgroundColors = {
    "Slow": "rgb(80, 80, 100)",
    "Medium": "rgb(70, 70, 140)",
    "Fast": "rgb(40, 40, 150)",
}


const cloudName = "dmajy6owm";
const charNames = ["mario","donkeykong","link","samus","darksamus","yoshi","kirby","fox","pikachu","luigi","ness","captainfalcon","jigglypuff","peach","daisy","bowser","iceclimbers","sheik","zelda","drmario","pichu","falco","marth","lucina","younglink","ganondorf","mewtwo","roy","chrom","gnw","metaknight","pit","darkpit","zss","wario","snake","ike","squirtle","ivysaur","charizard","diddykong","lucas","sonic","kingdedede","olimar","lucario","rob","toonlink","wolf","villager","megaman","wiifittrainer","rosalina","littlemac","greninja","palutena","pacman","robin","shulk","bowserjr","duckhunt","ryu","ken","cloud","corrin","bayonetta","inkling","ridley","simon","richter","kingkrool","isabelle","incineroar","plant","joker","hero","banjo","terry","byleth","minmin","steve","sephiroth","pyra","mythra","kazuya","sora","miibrawler","miisword","miigunner"];
const optionNames = ["rollNotBlue","normalGetupNotBlue", "jumpNotBlue","getupAttackNotBlue"];
const optionDisplayNames = ["Roll","Normal Getup", "Jump","Getup Attack"];

const TOTAL_SETS = charNames.length;   
const EXTRA_PAUSE_FRAMES = 4; 

const renderFilterSvg = () => <svg width="18px" height="18px" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 8H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M6 15H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M11 22H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>

const charNameMap = {
  squirtle: "pokemontrainer",
  ivysaur: "pokemontrainer",
  charizard: "pokemontrainer",
  rosalina: "rosalinaandluma",
  plant: "piranhaplant",
  banjo: "banjokazooie",
  miisword: "miiswordfighter"
}
const getCharThumb = (charName) => {
  const imgName = charNameMap[charName] || charName;
  return process.env.PUBLIC_URL + `/charEmojis/1386/${imgName}.png`
}

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
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showCharDropdown, setShowCharDropdown] = useState(false);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, incorrect: 0 });
  const [quizTargetVariant, setQuizTargetVariant] = useState(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [userSelection, setUserSelection] = useState(null);

  const [shouldShowNotes, setShouldShowNotes] = useState(true);

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

  const isQuizModeRef = useRef(false);
  const quizCanvasRef = useRef(null);
  const quizAnimFrameId = useRef(null);
  const quizFrameIndexRef = useRef(0);
  const quizLastFrameTime = useRef(0);
  const quizTimeoutRef = useRef(null);
  const quizAdvanceTimeoutRef = useRef(null);
  
  const targetVariantRef = useRef(null);

  const gestureRef = useRef({ startTime: 0, startX: 0, startY: 0 });
  const charBtnRef = useRef(null); 
  const MAX_TAP_DURATION = 250;
  const MAX_TAP_MOVE = 15;

  const quizAnsweredRef = useRef(false);

  // Close overlay if clicking outside the core search card element
  useEffect(() => {
    if (showCharDropdown) {
      const handleOutsideClick = (e) => {
        if (e.target.classList.contains('char-search-backdrop-modal')) {
          setShowCharDropdown(false);
        }
      };
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showCharDropdown]);

  const handlePointerDown = useCallback((e) => {
    if (e == null) return;
    gestureRef.current = {
      startTime: Date.now(),
      startX: e.clientX,
      startY: e.clientY,
    };
  }, []);

  const handlePointerUp = useCallback((e) => {
    if (e == null) return;
    const { startTime, startX, startY } = gestureRef.current;
    const duration = Date.now() - startTime;
    const diffX = Math.abs(e.clientX - startX);
    const diffY = Math.abs(e.clientY - startY);
    if (duration > MAX_TAP_DURATION || diffX > MAX_TAP_MOVE || diffY > MAX_TAP_MOVE) {
      return; 
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const tapXInsideContainer = e.clientX - rect.left;
    const isRightSide = tapXInsideContainer > rect.width / 2;
    if (isRightSide) {
      handleNextFrame();
    } else {
      handlePrevFrame();
    }
  }, []);
  
  const getOptionNameUrl = (charIndex, optionName) => {
    const charName = charNames[charIndex];
    return `https://opspritesheets.vercel.app/${charName}_${optionName}.webp`
    // return `https://res.cloudinary.com/${cloudName}/image/upload/ledgeoptions1/${charName}/${charName}_${optionName}.webp`;
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
    } else {
      optionNames.forEach((optionName, variantIdx) => {
        setTimeout(() => {
        paintVisibleFrame(variantIdx, 0);
        }, 0);
      })
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
    if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
    setQuizScore({ correct: 0, incorrect: 0 });
    setQuizAnswered(false);
    quizAnsweredRef.current = false;
    setUserSelection(null);

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
          if (isQuizModeRef.current) {
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
      if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
    };
  }, []);

  const stopQuizPlayback = () => {
    if (quizAnimFrameId.current) cancelAnimationFrame(quizAnimFrameId.current);
    if (quizTimeoutRef.current) clearTimeout(quizTimeoutRef.current);
  };

  const setupNextQuizQuestion = () => {
    stopQuizPlayback();
    if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
    setQuizAnswered(false);
    quizAnsweredRef.current = false;
    setUserSelection(null);

    if (isAssetLoadingRef.current || activeVariants.length === 0) return;

    const randomIndex = Math.floor(Math.random() * activeVariants.length);
    const chosenVariant = activeVariants[randomIndex];
    
    targetVariantRef.current = chosenVariant;
    setQuizTargetVariant(chosenVariant);

    replayQuizAnimation();
  };

  const replayQuizAnimation = () => {
    if (quizAnsweredRef.current) return;
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
        if (!quizAnsweredRef.current) {
          const canvas = quizCanvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        stopQuizPlayback();
      }
    } else {
      quizAnimFrameId.current = requestAnimationFrame(quizPlayTick);
    }
  };

  const handleQuizAnswer = (variantIdx) => {
    if (quizAnswered) return;

    setQuizAnswered(true);
    quizAnsweredRef.current = true;
    setUserSelection(variantIdx);

    const wasCorrect = variantIdx === targetVariantRef.current;
    if (wasCorrect) {
      setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setQuizScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
      
      const canvas = quizCanvasRef.current;
      if (canvas) {
        const currentMax = currentMaxFramesRef.current;
        const reviewFrameIdx = Math.min(13, currentMax - 1);
        
        const bakedCanvas = preRenderedFrames.current[targetVariantRef.current]?.[reviewFrameIdx];
        if (bakedCanvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bakedCanvas, 0, 0);
        }
      }
    }
    const advanceTime = wasCorrect ? 520 : 1000;
    quizAdvanceTimeoutRef.current = setTimeout(() => {
      setupNextQuizQuestion();
    }, advanceTime);
  };

  const handleQuizReset = () => {
    setQuizScore({ correct: 0, incorrect: 0 });
    setupNextQuizQuestion();
  };

  const handleToggleQuizMode = () => {
    if (isQuizModeRef.current) {
      stopQuizPlayback();
      if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
      targetVariantRef.current = null;
      setQuizTargetVariant(null);
      setQuizAnswered(false);
      quizAnsweredRef.current = false;
      setUserSelection(null);
      isQuizModeRef.current = false;
      setIsQuizMode(false);
      setTimeout(() => playAfterSwitch(), 50);
    } else {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      }
      isQuizModeRef.current = true;
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
      const isQuiz = isQuizModeRef.current;
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
        if (isQuiz === true) {
          replayQuizAnimation();
        } else {
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
  }, [isQuizMode, currentSetIndex, quizAnswered]);

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

      {showInfoDrawer && 
        <div className="info-drawer">
          <div className="drawer-header">
            <span>Ledge option reaction tool tips:</span>
            <button 
              className="btn-drawer-close" 
              onClick={() => setShowInfoDrawer(false)}
              title="Close Menu"
            >
              &times;
            </button>
          </div>
          <div>Use the {renderFilterSvg()} button to show less ledge options at a time.  Try Roll+NormalGetup, or Roll+NormalGetup+Jump</div>
          <div>🔁 through a smaller amount of frames to help learn to react to the beginning.</div>
          <div>On mobile the fullscreen ⛶ button helps in landscape</div>
          <div>🎓 Quiz mode lets you practice recognizing/reacting to the animations.  Make sure to adjust the ledge option {renderFilterSvg()} and 🔁 loop frames</div>
          <div>Use ‹ and › buttons to examine the animations frame by frame.  And the 1x button to change the play speed.  Remember brief changes are hard to react in 1x, things that show for multiple frames are better.</div>
          <div>Toggle note display 📝 to show/hide provided notes (not editable).</div>
          <div>Slow / Medium / Fast refers to the visual speed of the first 5-10 frames relative to that character's other options, with a preference towards the first 5</div>
          <div>Shortcuts:</div>
          <div>
            <div>left/right arrow: prev/next frame.</div>
            <div>,/. : prev/next character.</div>
            <div>tap left or right side of animations area: prev/next frame.</div>
          </div>
          <div>Reaction Info:</div>
          <div>The reaction here is a mix of a primed reaction (ledge motion start) + ledge decision (ledge animation recognition).  Trying to react to everything at once can be difficult and slow.  In the game, one way to optimize reaction times is to look for one option (e.g. Normal getup) and then execute a yes/no on that.  Then cascade to others e.g. roll.  Which one you look for depends on how many frames your option takes.</div>
          <div>Reaction times and methods vary, but as an example calculation, lets say that someone finds they need an option 7f or faster to successfully consistently react to Normal Getup.  Using a rough estimate of 18 to react, 34-7+1-18+1 = 11 frames of animation. For 4f (e.g 6f grab beating spotdodge) options that would be a bit more lenient, more like 14f of animation.  Use the loop setting to adjust to your needs.  This math is somewhat arbitrary since this is a difficult measurement to make.  Parts of the reaction are faster because you've already seen the ledge motion start so you're primed with the when, however the recognition+decision slow it down.  So the number of frames of animation may vary and could be smaller</div>
          <div>I find that primed visual reactions can go significantly faster than normal reactions, for instance someone reacting at 18-20 frames in game can go down to about 15 frames ish for a strong visual cue.  However, the cues are often not that strong for ledge motion, and the time window not that short, so are more likely to see that ~18 frames number.</div>
        </div>
      }

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

      {/* KEYBOARD VISUAL VIEWPORT TRACKING BACKDROP MODAL SYSTEM */}
      {showCharDropdown && (
        <div 
          className="char-search-backdrop-modal"
        >
          <div className="char-search-centered-card">
            <div className="char-modal-header">
              <span>Select Character</span>
              <button className="char-modal-close-x" onClick={() => setShowCharDropdown(false)}>&times;</button>
            </div>
            
            <input
              className="char-filter-search-box"
              placeholder="Type to filter characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              type="search"
              name="filter"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              />

            <div className="char-filter-search-list">
              {charNames
                .map((name, idx) => ({ name, idx }))
                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((char) => (
                  <div
                    key={char.name}
                    className={`char-search-row-item ${char.idx === currentSetIndex ? 'selected-target' : ''}`}
                    onClick={() => {
                      setCurrentSetIndex(char.idx);
                      setShowCharDropdown(false);
                    }}
                  >
                    <img 
                      src={getCharThumb(char.name)}
                      className='char-search-row-item-img'
                      alt=""
                    />
                    <div
                      className='char-search-row-item-text'
                    >
                      {char.name}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <div className="wrapper-container">
          <div className="sprite-grid-container" style={{ opacity: isAssetLoading ? 0.8 : 1 }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
          {
            renderedVariants.filter((_item, index) => !isQuizMode || index <1).map((variantIdx) => {
            // renderedVariants.map((variantIdx, index) => {
              const optionName = optionDisplayNames[variantIdx];
              const optionSpeed = optionSpeeds[variantIdx][currentSetIndex];
              const optionNote = optionNotes[variantIdx][currentSetIndex];
              return (
                <div key={variantIdx} className="sprite-card">
                  <h4 className="variant-title-inset">
                    {optionName ? optionName : `Variant ${variantIdx + 1}`}
                  </h4>
                  {shouldShowNotes &&
                    <div className="speed-inset" style={{background: speedBackgroundColors[optionSpeed]}}>
                      {optionSpeed}
                    </div>
                  }
                  {shouldShowNotes &&
                    <div className="notes-inset">
                      {optionNote}
                    </div>
                  }
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
              
              {quizAnswered && (
                <div className="quiz-feedback-banner">
                  {userSelection === quizTargetVariant ? (
                    <span className="quiz-feedback-text correct">✓ Correct ({optionDisplayNames[userSelection]})</span>
                  ) : (
                    <>
                      <span className="quiz-feedback-text incorrect">✗ Incorrect</span>
                      <span className="quiz-feedback-subtext">Correct option: <strong>{optionDisplayNames[quizTargetVariant]}</strong></span>
                    </>
                  )}
                </div>
              )}
              
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
            {renderedVariants.map((variantIdx) => {
              let modifierClass = "";
              if (quizAnswered) {
                if (variantIdx === quizTargetVariant) {
                  modifierClass = " correct-choice";
                } else if (userSelection === variantIdx) {
                  modifierClass = " incorrect-choice";
                }
              }

              return (
                <button
                  key={variantIdx} 
                  disabled={quizAnswered}
                  onClick={() => handleQuizAnswer(variantIdx)} 
                  className={`btn btn-ctrl quiz-buttons-btn quiz-guess-btn${modifierClass}`}
                >
                  {optionDisplayNames[variantIdx]}
                </button>
              );
            })}
            
            <button
              onClick={replayQuizAnimation} 
              disabled={quizAnswered} 
              className="btn btn-ctrl quiz-buttons-btn quiz-replay-btn" 
              title="Replay Animation"
            >
              Replay 🔁
            </button>
            
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

          <div 
            className={`select-wrapper char-select ${showCharDropdown ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowCharDropdown(!showCharDropdown);
              setShowFilterDrawer(false);
              setShowInfoDrawer(false);
              setSearchTerm("");
            }}
          >
            <span className="select-btn-label">{charNames[currentSetIndex]}</span>
          </div>

          <button 
            onClick={() => setShowFilterDrawer(!showFilterDrawer)} 
            className={`btn btn-ctrl btn-filter ${showFilterDrawer ? 'active' : ''}`}
            title="Configure Ledge Options"
          >
            {renderFilterSvg()}
          </button>
          
          <button onClick={() => setShouldShowNotes(prev => !prev)} className={`btn btn-ctrl btn-notes ${shouldShowNotes? "btn-notes-on":""}`} title="Toggle Notes">
            📝
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
          <button 
            onClick={() => setShowInfoDrawer(!showInfoDrawer)} 
            className={`btn btn-ctrl btn-info ${showInfoDrawer ? 'active' : ''}`}
            title="Show info/help"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  );
}