import './FilterButton.css'
import { GameIds, Characters, VideoGameInfoById } from './GameInfo.js'
import { charEmojiImagePath } from './Utilities.js'
function filterIcon() {
  return (
    <svg width="30px" height="30px" viewBox="0 0 30px 30px" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8H26" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 15H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M11 22H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  )
}

var charPositions = [
  {top: "42px", left: "15px"},
  {top: "30px", left: "-9px"},
  {top: "30px", left: "45px"},
  {top: "3px", left: "48px"},
  {top: "-15px", left: "24px"},
  {top: "-15px", left: "-0px"},
  {top: "-3px", left: "-15px"},
]

// var charPositions = [
//   {top: "28px", left: "10px"},
//   {top: "20px", left: "-6px"},
//   {top: "20px", left: "30px"},
//   {top: "2px", left: "32px"},
//   {top: "-10px", left: "16px"},
//   {top: "-10px", left: "-0px"},
//   {top: "-2px", left: "-10px"},
// ]


export function renderFilterButton(filterInfo, onClick) {
  var currentGameId = filterInfo.currentGameId
  var gameInfo = VideoGameInfoById[currentGameId]
  var characters = filterInfo?.filters[currentGameId]?.characters

  
  // characters = ["ken", "pikachu", "ridley", "mario", "zelda", "pokemontrainer", "marth"]
  var charIcons = []
  characters?.forEach((charName, charIndex) => {
    var charIconPath = charEmojiImagePath(charName, currentGameId)
    if (charIndex < charPositions.length) {
      var charIcon = <img className="charFilterIcon" style={{position: 'absolute', ...charPositions[charIndex]}} key={charName} src={charIconPath}></img>
      charIcons.push(charIcon)
    }
  })

  return (
    <div className="">
      <div className="filterButton"
        onClick={onClick}
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2),  rgba(0, 0, 0, 0.2)), url(${gameInfo.images.at(-1).url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // backgroundImage: `url(${gameInfo.images[0].url})`,
          }}
      >
        <div className="svgContainer" >
          {filterIcon()}
        </div>
        <div className="charFilterContainer">
          {
            charIcons
          }
        </div>
      </div>
    </div>
  )
}
