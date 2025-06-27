import './About.css'

function About() {
    return (
        <div>
            <header className="about-header">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <div>
                    <span className="about-heading1">About SetsOnStream</span><br/>
                    <span className="about-body">SetsOnStream is a project to see what sets are on stream,</span>
                    <span className="about-body"> and watch sets from around the world</span><br/>
                    <span className="about-body">Its origin is as an offshoot project of the SetsOnStream discord bot for charcords</span><br/>
                    <span className="about-body">SetsOnStream works by querying the active sets labeled as on stream in the start.gg API</span><br/>
                    <br/>
                    <span className="about-heading1">Limitations of SetsOnStream</span><br/>
                    <span className="about-body">SetsOnStream will catch many tourney sets on stream!</span><br/>
                    <span className="about-body">However, some amount of sets will not appear if they do not label a set for stream and set it active.</span><br/>
                    <span className="about-body">When using SetsOnStream, will need to refresh to pull current data</span><br/>
                    <span className="about-body">SetsOnStream guesses the character based on previous character history.  There are a lot of multi-main players so accuracy may vary.</span><br/>
                    <br/>
                    <span className="about-heading1">YouTube streams</span><br/>
                    <span className="about-body">For sets mapped to YouTube channels, you may see multiple YouTube links and a switch stream button.</span><br/>
                    <span className="about-body">That's because some tourneys run multiple live streams from the same channel and which one isn't known for a given set.</span><br/>
                    <br/>
                    <span className="about-heading1">Character info</span><br/>
                    <span className="about-body">Badges for <a className="about-body" href="https://x.com/SchuStats">SchuStats</a> character top 100 rankings are used to help provide context! </span><br/>
                    <br/>
                    <span className="about-heading1">Links to other useful sites</span><br/>
                    <span className="about-body">If you're looking for a map to find upcoming tournaments on, try these:</span><br/>
                    <a className="about-body" href="https://www.smash-mapping.com/" target="_blank">https://www.smash-mapping.com/</a><br/>
                    <a className="about-body" href="https://smash-map.com/" target="_blank">https://smash-map.com/</a><br/>
                    <br/>
                    <span className="about-heading1">Contact</span><br/>
                    <span className="about-body"><a className="about-body" href="https://x.com/jenghi_ssb">https://x.com/jenghi_ssb</a></span>
                </div>
            </header>
        </div>
    )
}

export default About