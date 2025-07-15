// components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AppNavBar.css'
const AppNavBar = () => {
    return (
    <div className="AppNavBarHolder">
        <nav className="AppNavBar">
            <Link className="AppNavBarItem" to="/">Home</Link>
            <Link className="AppNavBarItem" to="/fullmap">Full Map</Link>
            {/* <Link className="AppNavBarItem" to="/allinlist">All in List</Link> */}
            <Link className="AppNavBarItem" to="/about">About</Link>
        </nav>
        <ShareSvg/>
    </div>
    );
};


function ShareSvg() {
  const [copied, setCopied] = useState(false);
  const shareText = "Watch live and recent sets on stream for Smash Ultimate, SF6, Melee, Rivals 2, and more.\nhttps://setsonstream.tv"
  const shareData = {
    title: 'Sets on Stream',
    text: 'Watch live and recent sets on stream for Smash Ultimate, SF6, Melee, Rivals 2, and more.',
    url: 'https://setsonstream.tv'
  };

  const onClick = async () => {
    try {
        console.log(navigator.share, navigator.canShare(shareData))
        console.log("navigator.clipboard.writeText", navigator.clipboard.writeText)
        if (false && navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            console.log('Content shared successfully!');
        } else {
            setCopied(true); // Display "copied!"

            setTimeout(() => {
            setCopied(false); // Switch back to the icon after 2 seconds
            }, 1500);
            await navigator.clipboard.writeText(shareText);
            console.log('Share link copied successfully!');
        }
    } catch (err) {
        console.error('Failed to copy share link:', err);
    }
  }
  return (
    <div className="shareSvg" onClick={onClick}>
        {copied ? (
            <span className="shareSvgCopied">Share link copied!</span> 
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 365.61 285.686"><path opacity="1" fill="#000" fillOpacity="1" stroke="#eee" strokeWidth="20.00000191" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="4" strokeDasharray="none" strokeOpacity="1" d="M38.6 202.285v-30.656c-41.89-4.634-128.643-3.208-207.204 76.436C-137.337 132.47-100.573 84.49 38.6 43.487v-61.112l69.262 62.334c38.094 34.283 69.342 62.556 69.44 62.829.098.272-30.47 28.059-67.927 61.748l-69.44 62.453-1.335 1.201z" transform="translate(178.603 27.624)"/></svg>
        )}
    </div>
  )
}

export default AppNavBar;
