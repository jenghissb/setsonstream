import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, HashRouter, Outlet, useMatches } from "react-router-dom";

import './index.css';
import Home, {HomeModes} from './Home';
import About from './About';
import reportWebVitals from './reportWebVitals';
import AppNavBar from "./AppNavBar";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter >
      <main>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home homeMode={HomeModes.MAIN}/>} />
            <Route path="fullmap" element={<Home homeMode={HomeModes.FULLMAP}/>} />
            <Route path="allinlist" element={<Home homeMode={HomeModes.ALLINLIST}/>} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </main>
    </HashRouter>
  </React.StrictMode>
);

function Layout() {
  // const matches = useMatches();
  // const currentRoute = matches[matches.length - 1]; // Get the last (deepest) matched route
  // const headerTitle = currentRoute?.handle?.title || "Default Title"; // Access the title from the handle

  return (
    <>
      <header>
        <h1 class="visuallyhidden">Setsonstream.tv - Watch Fighting Game Tournaments</h1>
        <p class="visuallyhidden">Stream tournament sets from Smash Ultimate, Street Fighter 6, and more.</p>
        <AppNavBar/>
      </header>
      <Outlet />
    </>
  );
}



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
