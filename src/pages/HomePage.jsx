// src/pages/HomePage.jsx
import React from 'react';

// Pass handleCardClick down as a prop from App.jsx
function HomePage({ handleCardClick }) {
  return (
    <>
      <h2 className="page-title">Pixle Fit</h2>
      <div className="card-grid">
        {/* Card 1 */}
        <div
          className="measurement-card"
          onClick={() => handleCardClick('Get Measurements')} // Use the passed function
        >
          <h4 className="card-title">Auto Measurements</h4>
          <img
            src="/src/assets/Untitled.png"
            alt="MeasurementPNG"
            className="card-img"
          />
          <div className="card-text">
            <p>
              Get your measurements and map them to their corresponding standard sizes across Asian,
              European, and American sizing systems using advanced deep learning algorithms.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div
          className="measurement-card"
          onClick={() => handleCardClick('Try On')} // Use the passed function
        >
          <h4 className="card-title">Virtual Try On</h4>
          <img
            src="/src/assets/virtualtryonclipart.png"
            alt="Try On Clipart"
            className="card-img"
          />
          <div className="card-text">
            <p>
              Visualize and virtually try on clothing designs to see how they will look on you,
              providing a realistic preview of your style!
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div
          className="measurement-card"
          onClick={() => handleCardClick('Closet')} // Use the passed function
        >
          <h4 className="card-title">Our Closet</h4>
          <img
            src="/src/assets/closetclippart.png"
            alt="closetclipart"
            className="card-img"
          />
          <div className="card-text">
            <p>
              Explore a wide range of available clothing, including dresses, shirts, sweaters,
              and many more to find the perfect match for your style!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;