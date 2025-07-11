import './About.css'
import { getInternalImageUrl } from "./Utilities"

function About() {
    return (
        <div>
            <div className="about-header">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <div>
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
                </div>
            </div>
        </div>
    )
}

export default About