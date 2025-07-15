import './FilterTypeButton.css'
import { GameIds, Characters, VideoGameInfoById } from './GameInfo.js'
import { charEmojiImagePath } from './Utilities.js'

export const FilterType = Object.freeze({
  HIGHLIGHT: "highlight",
  FILTER: "filter",
})
function filterIcon() {
  return (
    <svg width="18px" height="18px" viewBox="0 0 28 28" fill="#none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 15H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 22H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function hideIcon() {
  return (
    <svg fill="#ddddddff" width="18px" height="18px" viewBox="0 -16 544 544" xmlns="http://www.w3.org/2000/svg">
      <title>hide</title><path d="M108 60L468 420 436 452 362 378Q321 400 272 400 208 400 154 361 99 322 64 256 79 229 102 202 124 174 144 160L76 92 108 60ZM368 256Q368 216 340 188 312 160 272 160L229 117Q254 112 272 112 337 112 392 152 446 192 480 256 474 269 461 288 448 307 434 322L368 256ZM272 352Q299 352 322 338L293 309Q283 312 272 312 249 312 233 296 216 279 216 256 216 247 220 236L190 206Q176 229 176 256 176 296 204 324 232 352 272 352Z" />
    </svg>
  )
}

// var charPositions = [
//   {top: "28px", left: "10px"},
//   {top: "20px", left: "-6px"},
//   {top: "20px", left: "30px"},
//   {top: "2px", left: "32px"},
//   {top: "-10px", left: "16px"},
//   {top: "-10px", left: "-0px"},
//   {top: "-2px", left: "-10px"},
// ]


export function renderFilterTypeButton(filterType = FilterType.HIGHLIGHT, changeFilterType) {
  // var currentGameId = filterInfo.currentGameId
  // var gameInfo = VideoGameInfoById[currentGameId]
  // var characters = filterInfo?.filters[currentGameId]?.characters

  var typeDiv = null
  if (filterType == FilterType.HIGHLIGHT) {
    typeDiv = <div className="filterTypeDot">•</div>
  } else {
    typeDiv = hideIcon()
  }
  //filterType, changeFilterType
  return <div className="filterTypeSvgContainer"
    onClick={() => {
      var newFilterType;
      if (filterType == FilterType.FILTER) {
        newFilterType = FilterType.HIGHLIGHT
      } else {
        newFilterType = FilterType.FILTER
      }
      changeFilterType(newFilterType)
    }}
    >
      {filterIcon()}
      <div className="filterTypeEq">=</div>
      {typeDiv}
    </div>

  // return (
  //   <div className="">
  //     <div className="filterButton"
  //       onClick={onClick}
  //       style={{
  //         backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4),  rgba(0, 0, 0, 0.4)), url(${gameInfo.images.at(-1).url})`,
  //         backgroundSize: "cover",
  //         backgroundPosition: "center",
  //         // backgroundImage: `url(${gameInfo.images[0].url})`,
  //         }}
  //     >
  //       <div className="svgContainer" >
  //         {filterIcon()}
  //       </div>
  //       <div className="charFilterContainer">
  //         {
  //           charIcons
  //         }
  //       </div>
  //     </div>
  //   </div>
  // )
}
