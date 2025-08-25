import './About.css'
import { Helmet } from "react-helmet-async";
import { getInternalImageUrl } from "./Utilities"
import { LightModeSvg, DarkModeSvg } from "./DarkModeToggle"
import { FeedbackButton } from "./Feedback"
import Star from "./Star";
function About() {
    const title = "About - Sets on Stream"
    const description = "Watch live and recent matches from fighting game tournaments: Smash Ultimate, SF6, Rivals 2, Tekken 8, and more."
    const darkEmojiDim = "24px"
    return (
        <div>
            <div className="about-header">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <div>
                    <Helmet>
                        <title>{title}</title>
                        <meta name="description" content={description} />
                        <meta name="twitter:title" content={title}/>
                        <meta name="twitter:description" content={description}/>
                    </Helmet>
                    <h1 className="about-heading1">SetsOnStream: version 2.0.0 (08/24/2025) 🎉</h1><br/>
                    <span className="about-body">Sets on Stream 2.0 adds new navigation, favorites system, search system, bigger watching view</span><br/>
                    <h3 className="about-heading2 about-body-row-flex">New <div className="about-feedback-holder"><FeedbackButton setFeedbackOpen={() => {}}/></div> button in top bar!</h3>
                    <span className="about-body">-- Please use to provide ideas to make this site awesome.</span><br/>
                    <span className="about-body">Live and Recent have been combined</span><br/>
                    <h3 className="about-heading2 about-body-row-flex">Favorites <div className="about-RouteStarIcon"><Star filled={true} onToggle={() => {}} /></div></h3>
                    <span className="about-body">Favorite any Character, Player, or Channel to have it appear on your home page</span><br/>
                    <span className="about-body">Filters migrated to favorites</span><br/>
                    <h3 className="about-heading2">Navigation</h3>
                    <span className="about-body">Search for or click on any tourney title, char icon, stream icon, player name, to go to its page!  Favorite it to keep track of new sets in the future</span><br/>
                    <span className="about-body">New navigation system makes it easier to share SetsOnStream links to characters, tourneys, etc.</span><br/>
                    <h3 className="about-heading2 about-body-row-flex">Light/Dark mode toggle <div style={{paddingLeft:"4px", paddingRight:"6px"}}><LightModeSvg height={darkEmojiDim} width={darkEmojiDim}/> <DarkModeSvg height={darkEmojiDim} width={darkEmojiDim}/></div> in top bar</h3>
                    <span className="about-body">Various site performance optimizations make navigating faster</span><br/>
                    <span className="about-body">Average faster set detection time (still optimizing)</span><br/>
                    <span className="about-body">End time is accurate to actual end of set on start.gg</span><br/>
                    <span className="about-body">Sets on Stream 2.0 deprecates big map view (for now)</span><br/>
                    <br/>                    
                    <h1 className="about-heading1">About SetsOnStream:  version 1</h1><br/>
                    <span className="about-body">SetsOnStream is a project to see what sets are on stream,</span>
                    <span className="about-body"> and watch sets from around the world</span><br/>
                    <img className="exampleScreenShot" src={getInternalImageUrl("ExampleScreenshot.png")}/><br/>
                    <span className="about-body">Its origin is as an offshoot project of the SetsOnStream discord bot for charcords</span><br/>
                    <span className="about-body">SetsOnStream works by querying the active sets labeled as on stream in the start.gg API <br/>Then mapping the set information to the stream videos so you can watch live or rewind to the start of sets</span><br/>
                    <span className="about-body">Recent sets can be viewed for a while if the stream VOD is available</span><br/>
                    <br/>
                    <h2 className="about-heading1">Limitations of SetsOnStream</h2><br/>
                    <span className="about-body">SetsOnStream will catch many tourney sets on stream!</span><br/>
                    <img className="good1" src={getInternalImageUrl("ExampleGood1.png")}/><br/><div className='about-exp'>✅: labeled for stream and active!</div><br/>
                    <span className="about-body">However, some amount of sets will not appear if they do not label a set for stream and set it active.</span><br/>
                    <img className="bad1" src={getInternalImageUrl("ExampleBad1.png")}/><br/><div className='about-exp'>❌: not active</div><br/>
                    <img className="bad2" src={getInternalImageUrl("ExampleBad2.png")}/><br/><div className='about-exp'>❌: no stream marked</div><br/>
                    <span className="about-body">When using SetsOnStream, you'll need to refresh to pull current sets data.</span><br/>
                    <span className="about-body">SetsOnStream guesses the character based on previous character history.  There are a lot of multi-main players so accuracy may vary.</span><br/>
                    <br/>
                    <h2 className="about-heading1">YouTube streams</h2><br/>
                    <span className="about-body">For sets mapped to YouTube channels, you may see multiple YouTube links and a switch stream button.</span><br/>
                    <span className="about-body">That's because some tourneys run multiple live streams from the same channel and which one isn't known for a given set.</span><br/>
                    <br/>
                    <h2 className="about-heading1">Character info</h2><br/>
                    <span className="about-body">Badges for <a className="about-body" href="https://x.com/SchuStats">SchuStats</a> character top 100 rankings are used to help provide context! </span><br/>
                    <br/>
                    <h2 className="about-heading1">Links to other useful sites</h2><br/>
                    <span className="about-body">If you're looking for a map to find upcoming tournaments on, try these:</span><br/>
                    <a className="about-body" href="https://www.smash-mapping.com/" target="_blank">https://www.smash-mapping.com/</a><br/>
                    <a className="about-body" href="https://smash-map.com/" target="_blank">https://smash-map.com/</a><br/>
                    <br/>
                    <h2 className="about-heading1">Contact</h2><br/>
                    <span className="about-body"><a className="about-body" href="https://x.com/jenghi_ssb">jenghi_ssb</a></span>
                    <br/>
                    <br/>
                </div>
            </div>
        </div>
    )
}

export default About