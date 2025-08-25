import "./Star.css"; // same css from before

export default function Star({ filled, onToggle }) {
  return (
    <button
      className={`star-button ${filled ? "filled" : ""}`}
      onClick={onToggle}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="star-icon"
      >
        <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.772 
                 1.48 8.229L12 18.896l-7.416 4.411 
                 1.48-8.229L0 9.306l8.332-1.151z" />
      </svg>
    </button>
  );
}
