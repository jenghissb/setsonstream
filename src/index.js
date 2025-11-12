import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, HashRouter, Outlet, useMatches } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import './index.css';
import Home2, {HomeModes, HomeTypes} from './Home';
import About from './About';
import reportWebVitals from './reportWebVitals';
import AppNavBar from "./AppNavBar";
import { FeedbackModal } from "./Feedback";
import { ThemeContext, ThemeProvider } from './ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
document.body.style.overflow = "hidden"
root.render(
  <React.StrictMode>
    <ThemeProvider>
    <HelmetProvider>
    <BrowserRouter >
      <main>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="game" index element={<Home2 homeType={HomeTypes.GAME}/>} />
            <Route path="game/:gameParam" index element={<Home2 homeType={HomeTypes.GAME}/>} />
            <Route path="game/:gameParam/set/:setParam" index element={<Home2 homeType={HomeTypes.GAME}/>} />
            <Route path="game/:gameParam/char/:charParam" index element={<Home2 homeMode={HomeModes.MAIN} homeType={HomeTypes.CHARACTER}/>} />
            <Route path="game/:gameParam/char/:charParam/set/:setParam" index element={<Home2 homeMode={HomeModes.MAIN} homeType={HomeTypes.CHARACTER}/>} />
            <Route path="game/:gameParam/player/:playerParam" index element={<Home2 homeMode={HomeModes.MAIN} homeType={HomeTypes.PLAYER}/>} />
            <Route path="game/:gameParam/player/:playerParam/set/:setParam" index element={<Home2 homeMode={HomeModes.MAIN} homeType={HomeTypes.PLAYER}/>} />
            <Route path="game/:gameParam/tournament/:tourneyParam" index element={<Home2 homeType={HomeTypes.TOURNAMENT}/>} />
            <Route path="game/:gameParam/tournament/:tourneyParam/set/:setParam" index element={<Home2 homeType={HomeTypes.TOURNAMENT}/>} />
            <Route path="game/:gameParam/channel/:channelParam" index element={<Home2 homeType={HomeTypes.CHANNEL}/>} />
            <Route path="game/:gameParam/channel/:channelParam/set/:setParam" index element={<Home2 homeType={HomeTypes.CHANNEL}/>} />
            <Route path="game/:gameParam/search/:searchParam" index element={<Home2 homeType={HomeTypes.SEARCH}/>} />
            <Route path="game/:gameParam/search/:searchParam/set/:setParam" index element={<Home2 homeType={HomeTypes.SEARCH}/>} />
            <Route index element={<Home2 homeMode={HomeModes.MAIN}/>} />
            {/* <Route index element={<Home homeMode={HomeModes.MAIN}/>} /> */}
            <Route path="fullmap" element={<Home2 homeMode={HomeModes.FULLMAP}/>} />
            <Route path="allinlist" element={<Home2 homeMode={HomeModes.ALLINLIST}/>} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </main>
    </BrowserRouter>
    </HelmetProvider>
    </ThemeProvider>
  </React.StrictMode>
);

function Layout() {
  // const matches = useMatches();
  // const currentRoute = matches[matches.length - 1]; // Get the last (deepest) matched route
  // const headerTitle = currentRoute?.handle?.title || "Default Title"; // Access the title from the handle

  // return <>
  //   <ThreePaneLayout />
  // </>

  // const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  // const saved = localStorage.getItem('theme');
  // const initialtheme = saved || (prefersLight ? 'light' : null); // null → use default (dark)
  // document.documentElement.setAttribute('data-theme', initialtheme);

  // const [theme, setTheme] = useState(initialtheme);
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);

  // useEffect(() => {
  //   console.log("setting data theme!!!!!!", theme)
  //   document.documentElement.setAttribute('data-theme', theme);
  //   localStorage.setItem('theme', theme);
  // }, [theme]);

  // const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <>
      {/* <header> */}
      <header style={{ top: 0, position: "sticky", zIndex: 2004 }}>
        <h1 className="visuallyhidden">Setsonstream.tv - Watch Fighting Game Tournaments</h1>
        <p className="visuallyhidden">Stream tournament sets from Smash Ultimate, Street Fighter 6, and more.</p>
        <AppNavBar toggleTheme={toggleTheme} setFeedbackOpen={setFeedbackOpen} />
      </header>
      <Outlet />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
