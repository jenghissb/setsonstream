
export const IconStartGg = ({width, height}) => {
  const st0 = { fill: "#3F80FF" }
  const st1 = { fill: "#FF2768" }
  return <svg version="1.1" id="start.gg_icon" xmlns="http://www.w3.org/2000/svg" width={width} height={height} x="0px"
      y="0px" viewBox="0 0 1001 1001" space="preserve">
    {/* <style type="text/css">
      .st0{fill:#3F80FF;}
      .st1{fill:#FF2768;}
    </style> */}
    <g>
      <path style={st0} d="M32.2,500h187.5c17.3,0,31.2-14,31.2-31.2V281.2c0-17.3,14-31.2,31.2-31.2h687.5c17.3,0,31.2-14,31.2-31.2
        V31.2C1001,14,987,0,969.7,0H251C112.9,0,1,111.9,1,250v218.8C1,486,15,500,32.2,500z"/>
      <path style={st1} d="M969.8,500H782.3c-17.3,0-31.2,14-31.2,31.2v187.5c0,17.3-14,31.2-31.2,31.2H32.3C15,750,1,764,1,781.2v187.5
        C1,986,15,1000,32.3,1000H751c138.1,0,250-111.9,250-250V531.2C1001,514,987,500,969.8,500z"/>
    </g>
  </svg>
}

export const IconTwitch = ({width, height}) => {
  const st0 = { fill: "#FFFFFF" }
  const st1 = { fill: "#9146FF" }
  return <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" width={20} height={20} x="0" y="0"
    viewBox="0 0 2400 2800" space="preserve">
    <g>
      <polygon style={st0} points="2200,1300 1800,1700 1400,1700 1050,2050 1050,1700 600,1700 600,200 2200,200 	"/>
      <g>
        <g id="Layer_1-2">
          <path style={st1} d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600
            V1300z"/>
          <rect x="1700" y="550" style={st1} width="200" height="600"/>
          <rect x="1150" y="550" style={st1} width="200" height="600"/>
        </g>
      </g>
    </g>
  </svg>
}

export const IconYoutube = ({width, height, color}) => {
  return <svg viewBox="0 0 28.57 20" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" focusable="false" width={"29px"} height={"20px"} style={{pointerEvents: "none", display: "block"}}>
      <g>
        <path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" fill="#FF0000"></path>
        <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white"></path>
      </g>
    </svg>
}

export const IconStream = ({width, height, streamSource}) => {
  if (streamSource === "YOUTUBE") {
    return <IconYoutube />
  } else {
    return <IconTwitch />
  }
  // return <IconTwitch width={width} height={height} />
}