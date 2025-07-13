import { useState, React } from 'react';

import './RewindSetButton.css'
import { supportsRewindSet } from './Utilities'
// import { Slider } from '@mui/material';
import debounce from 'lodash/debounce';

import { getStreamTimeOffset } from './VideoEmbeds.js'
import Slider, { SliderThumb, SliderValueLabelProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

function renderSvg(width="40px", height="40px", color="#bbbbbb") {
  return <svg width={width} height={height} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" strokeWidth="4" stroke={color} fill="none"><path d="M34.46,53.91A21.91,21.91,0,1,0,12.55,31.78"/><polyline points="4.65 22.33 12.52 32.62 22.81 24.75"/></svg>

  return <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
      </marker>
    </defs>

    <path d="M 50 10 A 40 40 0 1 0 10 50" fill="none" stroke="black" strokeWidth="4" marker-end="url(#arrow)" />
  </svg>
}

export function renderRewindSetButton(setUseLiveStream) {
  return <div onClick={() => setUseLiveStream(false)} className="rewindSetButton">
    {renderSvg()}
  </div>
}

export function renderRewindShortButton(rewindSet) {
  const secondsToRewind = 5;
  return <div onClick={() => rewindSet(5)} className="rewindShortButton">
    {renderSvg("32px", "32px", "#dddddd")}
    <div className='rewindShortText'>{secondsToRewind}</div>
  </div>
}

export function RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow, handleTimestampChange, rewindReady}) {
  useLiveStream = useLiveStream && !showVodsMode
  if (!supportsRewindSet(item)) {
    return
  }
  if (!shouldShow) {
    return <div className="rewindSetButton" ></div>
  }
  if (useLiveStream) {
    return renderRewindSetButton(setUseLiveStream)
  } else {
    return RewindControlRow({item, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady})
  }
}

function convertSecondstoTimeStr(given_seconds) {
  var signStr = ""
  if (given_seconds < 0) {
    signStr = "-"
    given_seconds = Math.abs(given_seconds)
  }
  var hours = Math.floor(given_seconds / 3600);
  var minutes = Math.floor((given_seconds - (hours * 3600)) / 60);
  var seconds = Math.floor(given_seconds - (hours * 3600) - (minutes * 60));

  var timeString = seconds.toString().padStart(2, '0');
  if (hours < 1) {
    timeString = minutes.toString() + ':' + timeString
  } else {
    timeString = minutes.toString().padStart(2, '0') + ':' + timeString
  }
  if (hours > 0) {
    timeString = hours.toString() + ':' + timeString
  }
  // var timeString = hours.toString().padStart(2, '0') + ':' +
  //   minutes.toString().padStart(2, '0') + ':' +
  //   seconds.toString().padStart(2, '0');
  return `${signStr}${timeString}`
}

export function renderSetLiveButton(setUseLiveStream) {
  return <div onClick={() => setUseLiveStream(true)} className="rewindSetButton">
    {renderLiveSvg()}
  </div>
}

function renderLiveSvg() {
  return <svg width="40px" height="40px" viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" version="1.1" baseProfile="full" enable-background="new 0 0 76.00 76.00" space="preserve">
    <path fill="#bbbbbb" fill-opacity="1" strokeWidth="0.3" stroke-linejoin="round" d="M 30.0833,20.5833L 50.6665,36.021L 50.6665,37.2084L 30.0833,52.25L 30.0833,20.5833 Z M 26.9166,57L 28.5,57L 28.5,63.3333L 31.6666,63.3333L 31.6666,64.9167L 28.5,64.9167L 26.9166,64.9167L 26.9166,57 Z M 33.25,64.9167L 33.25,57L 34.8333,57L 34.8333,64.9167L 33.25,64.9167 Z M 36.8124,57L 38.7916,57L 40.375,62.2779L 41.9583,57L 43.9375,57L 41.1666,64.9167L 39.5833,64.9167L 36.8124,57 Z M 45.9166,57L 47.5,57L 50.6666,57L 50.6666,58.5833L 47.5,58.5833L 47.5,60.1667L 50.6667,60.1667L 50.6667,61.75L 47.5,61.75L 47.5,63.3333L 50.6667,63.3333L 50.6667,64.9167L 47.5,64.9167L 45.9166,64.9167L 45.9166,57 Z "/>
  </svg>
}

function RewindControlRow({item, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady}) {
  var liveButton = null
  if (!showVodsMode) {
    liveButton = renderSetLiveButton(setUseLiveStream)
  }
  var streamUrls = item.streamInfo.streamUrls[0]
  var startedAt = item.bracketInfo.startedAt
  var endedAt = item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  var duration = Math.min(endedAt-startedAt, 60*60)
  var endedAt = startedAt + endedAt

  var streamOffset = getStreamTimeOffset(item, 0)
  
  const [currentProgress, setCurrentProgress] = useState(null);
  const [mouseDownTimeoutInfo, setMouseDownTimeoutInfo] = useState(null);

  rewindReady(progress => {
    if(mouseDownTimeoutInfo == null) {
      setCurrentProgress(progress)
    }
  })

  var value = currentProgress 

  const updateChangeExternal = (event, newValue) =>{
    var info = {}
    if (mouseDownTimeoutInfo != null) clearTimeout(mouseDownTimeoutInfo.timeout)
    if (mouseDownTimeoutInfo == null) {
      info = {initValue: currentProgress}
    } else {
      info.initValue = mouseDownTimeoutInfo.initValue
    }
    info.timeout = setTimeout(() => setMouseDownTimeoutInfo(null), 6500)
    setMouseDownTimeoutInfo(info)
    handleTimestampChange(streamOffset + newValue)
  }
  const debouncedChangeExternal = debounce(updateChangeExternal, 500, {leading: true, trailing: true});

  const handleChange = (event, newValue) => {
    debouncedChangeExternal(event, newValue)
    setCurrentProgress(newValue)
  };

  const rewindShort = (rewindAmount) => {
    handleTimestampChange(null, rewindAmount)
  }

  var marks = [
    {
      value: 0,
      label: <div className='markContainer'>start</div>,
    },
  ];
  if (item.bracketInfo.endTimeDetected != null) {
    marks.push(
      {
        value: duration,
        label: <div className='markContainer'>{convertSecondstoTimeStr(duration)}</div>,
      },
    )
  }

  const valueToUse = Math.floor(currentProgress)
  return <div className="rewindSetRow">
    {
      renderRewindShortButton(rewindShort)
    }
    <StyledSlider
      size="medium"
      defaultValue={0}
      min={-4*60}
      max={duration+4*60}
      onChange={handleChange}
      valueLabelFormat={(value) => convertSecondstoTimeStr(value)}
      marks={marks}
      value={valueToUse}
      aria-label="Small"
      valueLabelDisplay="auto"
    />
    {
      liveButton
    }
  </div>
}


const StyledSlider = styled(Slider)({
  color: '#52af77',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-rail': {
    color: '#52af77',
    opacity: 0.7,
    height: 5,
  },
  '& .MuiSlider-thumb': {
    height: 26,
    width: 18,
    borderRadius: 6,
    backgroundColor: '#ddd',
    border: '1.5px solid rgb(57, 121, 82)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&::before': {
      display: 'none',
    },
  },
});
