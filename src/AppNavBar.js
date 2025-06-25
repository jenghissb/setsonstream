    // components/Navbar.js
    import React from 'react';
    import { Link } from 'react-router-dom';
    import './AppNavBar.css'
    const AppNavBar = () => {
      return (
        <div style={{display: "flex", flexDirection: "row", width: "100vw"}}>
            <nav className="AppNavBar">
                <Link className="AppNavBarItem" to="/">Home</Link>
                <Link className="AppNavBarItem" to="/fullmap">Full Map</Link>
                <Link className="AppNavBarItem" to="/allinlist">All in List</Link>
                <Link className="AppNavBarItem" to="/about">About</Link>
            </nav>
            <div>Game</div>
        </div>
      );
    };

    export default AppNavBar;
