import React from "react";
import "./ThreePaneLayout.css"; // We'll define styles separately

// const ThreePaneLayout = () => {
//   return (
//     <div className="container">
//       <div className="pane">
//         <h2>Pane 1</h2>
//         {Array.from({ length: 12 }, (_, i) => (
//           <div className="content-block" key={`p1-${i}`}>
//             Item {i + 1}
//           </div>
//         ))}
//       </div>
//       <div className="pane">
//         <h2>Pane 2</h2>
//         {Array.from("ABCDEFGHIJKL").map((char, i) => (
//           <div className="content-block" key={`p2-${i}`}>
//             Item {char}
//           </div>
//         ))}
//       </div>
//       <div className="pane">
//         <h2>Pane 3</h2>
//         {[
//           "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
//           "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda"
//         ].map((word, i) => (
//           <div className="content-block" key={`p3-${i}`}>
//             {word}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

const ThreePaneLayout = () => {
  return (
    <div className="flex-container">
      <div className="pane">
        <h2>Pane 1</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <div className="content-block" key={`p1-${i}`}>
            Item {i + 1}
          </div>
        ))}
      </div>
      <div className="pane">
        <h2 style={{position: "sticky", top: 0}}>Pane 2</h2>
        {Array.from({ length: 20 }, (_, i) => (
          <div className="content-block" key={`p2-${i}`}>
            Item {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <div className="pane">
        <h2>Pane 3</h2>
        {[
          "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
          "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda"
        ].map((word, i) => (
          <div className="content-block" key={`p3-${i}`}>
            {word}
          </div>
        ))}
      </div>
    </div>
  );
};


export default ThreePaneLayout;
