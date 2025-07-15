import { useState, useRef } from 'react';
import './TimeRangeSlider.css'
import * as React from 'react';
import Slider, { SliderThumb, SliderValueLabelProps } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { debounce } from 'lodash';
 

function convertSecondstoTimeStr(value) {
  if (value < -7.5) {
    return `8+ days ago`
  }
  return `${Math.trunc(Math.abs(value))} days ago`
}

function normalizeRange(inputRange, minMaxRange) {
  var normalizedRange = [...inputRange]
  if (inputRange[0] < minMaxRange[0]) {
    normalizedRange[0] = minMaxRange[0]
  }
  if (inputRange[1] > minMaxRange[1]) {
    normalizedRange[1] = minMaxRange[1]
  }
  return normalizedRange
}

export const TimeRangeSlider = ({width, height, onChange, gameId, initialTimeRange}) => {
  const rangeMinMax = [-8, 0]
  const defaultValues = normalizeRange(initialTimeRange, rangeMinMax)

  // const defaultValues = [-6, 0]
  const [currentProgress, setCurrentProgress] = useState(defaultValues);
  const [dragOffset, setDragOffset] = useState(null);
  
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  var marks = [
    {
      value: -7,
      label: <div className='timeMarkContainer'>{convertSecondstoTimeStr(-7)}</div>,
    },
    {
      value: 0,
      label: <div className='timeMarkContainer' style={{marginRight:"40px"}}>present</div>,
    },
  ];
  
  const updateChangeExternal = (updatedValue) =>{
    onChangeRef.current(updatedValue)
  }

  const debouncedChangeExternal = useRef(debounce(updateChangeExternal, 500)).current;

  // const debouncedChangeExternal = debounce(updateChangeExternal, 500);
  //, {leading: false, trailing: true}
  
  const handleChange = (event, newValue) => {
    var updatedValue = [...newValue]
    // if (newValue[0] < currentProgress[0]) {
    //   updatedValue[0] = currentProgress[0]
    // }
    if (event.type == "mousedown" || event.type == "touchstart") {
      if (newValue[0] > currentProgress[0] + 0.4) {
        // console.log("downA", event.type, newValue, currentProgress)
        setDragOffset({
          offset: newValue[0], isLeft: true, initialProgress: currentProgress
        })
      } else if ((newValue[1] < currentProgress[1] - 0.4)){
        // console.log("downB", event.type, newValue, currentProgress)
        setDragOffset({
          offset: newValue[1], isLeft: false, initialProgress: currentProgress
        })
      } else {
        // console.log("downC", event.type, newValue, currentProgress)
        setDragOffset(null)
      }
      // setCurrentProgress([...currentProgress])
      setCurrentProgress(normalizeRange(currentProgress, rangeMinMax))
    } else {
      if (dragOffset != null && dragOffset.isLeft) {
        var offsetVal = newValue[0] - dragOffset.offset
        updatedValue[0] = dragOffset.initialProgress[0] + offsetVal
        updatedValue[1] = dragOffset.initialProgress[1] + offsetVal
        // console.log("moveA", event.type, newValue, currentProgress, updatedValue, dragOffset)
      } else if (dragOffset != null && !dragOffset.isLeft) {
        var offsetVal = newValue[1] - dragOffset.offset
        updatedValue[0] = dragOffset.initialProgress[0] + offsetVal
        updatedValue[1] = dragOffset.initialProgress[1] + offsetVal
        // console.log("moveB", event.type, newValue, currentProgress, updatedValue, dragOffset)
      } else {
        updatedValue = [...newValue]
        // console.log("moveC", event.type, newValue, currentProgress, updatedValue, dragOffset)
      }
      updatedValue = normalizeRange(updatedValue, rangeMinMax)
      setCurrentProgress(updatedValue)
      debouncedChangeExternal(updatedValue)
    }
  };

  // const marks = [-7, ]
  var marginTop = `calc(${height} - 100px)`
  // marginTop:height - 100
  return <div className="timeSliderContainer" style={{}}>
    <AirbnbSlider
      slots={{ thumb: AirbnbThumbComponent }}
      size="medium"
      defaultValue={defaultValues}
      min={-8}
      max={0}
      step={0.1}
      onChange={handleChange}
      valueLabelFormat={(value) => convertSecondstoTimeStr(value)}
      marks={marks}
      value={currentProgress}
      aria-label="Small"
      valueLabelDisplay="auto"
    />
    {
      // liveButton
    }
  </div>
}




// interface AirbnbThumbComponentProps extends React.HTMLAttributes<unknown> {}

function AirbnbThumbComponent(props) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
    </SliderThumb>
  );
}

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: '#3a8589',
  height: 3,
  padding: '13px 0',
  '& .MuiSlider-thumb': {
    height: 27,
    width: 27,
    backgroundColor: '#dddddd',
    border: '1px solid currentColor',
    '&:hover': {
      boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)',
    },
    '& .airbnb-bar': {
      height: 9,
      width: 1,
      backgroundColor: 'currentColor',
      marginLeft: 1,
      marginRight: 1,
    },
  },
  '& .MuiSlider-track': {
    height: 3,
  },
  '& .MuiSlider-rail': {
    color: '#d8d8d8',
    opacity: 1,
    height: 3,
    border: '1px solid #6a6a6a',
    ...theme.applyStyles('dark', {
      color: '#bfbfbf',
      opacity: undefined,
    }),
  },
}));
