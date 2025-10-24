import './CharButton.css'
import { GameIds, ButtonCharacters, VideoGameInfoById } from './GameInfo.js'
import { charEmojiImagePath } from './Utilities.js'
function drawerIcon() {
  const color = "var(--border-button)"
  return (
    <svg width="30px" height="30px" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7H25" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15H25" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 23H25" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

var charPositions = [
  {top: "2px", left: "3px"},
  {top: "2px", left: "21px"},
  {top: "20px", left: "3px"},
  {top: "20px", left: "21px"},
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


export function renderCharButton(filterInfo, onClick) {
  var currentGameId = filterInfo.currentGameId
  var gameInfo = VideoGameInfoById[currentGameId]
  // var characters = filterInfo?.filters[currentGameId]?.characters

  
  // characters = ["ken", "pikachu", "ridley", "mario", "zelda", "pokemontrainer", "marth"]
  const characters = ButtonCharacters[currentGameId]
  var charIcons = []
  characters?.forEach((charName, charIndex) => {
    var charIconPath = charEmojiImagePath(charName, currentGameId)
    if (charIndex < charPositions.length) {
      var charIcon = <img className="cb-charFilterIcon" style={{position: 'absolute', ...charPositions[charIndex]}} key={charName} src={charIconPath}></img>
      charIcons.push(charIcon)
    }
  })
  
  return (
    <div className="">
      <div className="cb-filterButton"
        onClick={onClick}
        style={characters ? {
          background: "var(--bg-modal)",
          } : {
          background: "var(--bg-modal)",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4),  rgba(0, 0, 0, 0.4)), url(${gameInfo.images.at(-1).url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // backgroundImage: `url(${gameInfo.images[0].url})`,
          }
        }
      >
        <div className="cb-charFilterContainer">
          {
            charIcons
          }
        <div className="cb-svgContainer" >
          {drawerIcon()}
        </div>
        </div>
      </div>
    </div>
  )
}
