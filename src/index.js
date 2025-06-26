import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import './index.css';
import Home, {HomeModes} from './Home';
import About from './About';
import reportWebVitals from './reportWebVitals';
import AppNavBar from "./AppNavBar";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <AppNavBar/>
      <Routes>
        <Route index element={<Home homeMode={HomeModes.MAIN}/>} />
        <Route path="fullmap" element={<Home homeMode={HomeModes.FULLMAP}/>} />
        <Route path="allinlist" element={<Home homeMode={HomeModes.ALLINLIST}/>} />
        <Route path="about" element={<About />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
