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
                    <span className="about-body">SetsOnStream works by querying the active sets labeled as on stream in the start.gg api</span><br/>
                    <br/>
                    <br/>
                    <span className="about-heading1">Links to other useful sites</span><br/>
                    <span className="about-body">If you're looking for a map to find upcoming tournaments on, try these:</span><br/>
                    <a className="about-body" href="https://www.smash-mapping.com/" target="_blank">https://www.smash-mapping.com/</a><br/>
                    <a className="about-body" href="https://smash-map.com/" target="_blank">https://smash-map.com/</a>
                </div>
            </header>
        </div>
    )
}

export default About