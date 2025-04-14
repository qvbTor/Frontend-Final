import React from 'react';
import './Card.css'; // Import the CSS file for styling

function Card() {
  return (
    <div className="card">
      <img src="https://via.placeholder.com/150" alt="Card image" className="card-img" />
      <div className="card-body">
        <h2 className="card-title">Auto Measurements</h2>
        <p className="card-text">This is some text within the card. You can add more content here as needed.</p>
        <button className="card-btn">Click Me</button>
      </div>
    </div>
  );
}

export default Card;
