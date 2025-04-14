// src/pages/MeasurementsPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
// Make sure your App.css or another relevant CSS file is imported if needed
import '../App.css';

function MeasurementsPage() {
  // --- State and Refs moved from App.jsx ---
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'environment', // Or 'user' for front camera
  };

  const webcamRef = useRef(null);

  const [frontSnapshot, setFrontSnapshot] = useState(null); // Renamed from snapshot for clarity if needed
  const [measurements, setMeasurements] = useState({
    chest: '---',
    shoulder: '---',
    hip: '---',
    thigh: '---',
  });
  const [sizes, setSizes] = useState({
    us: '---',
    uk: '---',
    asian: '---',
  });

  const [showCameraPermission, setShowCameraPermission] = useState(true); // Show permission initially
  const [showInformation, setShowInformation] = useState(false);
  const [showSnapshotPopUp, setShowSnapshotPopUp] = useState(false); // If you still need this distinct popup
  // --- End State and Refs ---


  // --- Functions moved from App.jsx ---
  const handlePopUpClick = (popUpName) => {
    if (popUpName === 'closeCamera') {
      setShowCameraPermission(false);
      // Maybe show 'information' popup next, or just show the main view
      // setShowInformation(true); // Or set to false if not needed
    }

    if (popUpName === 'closeInformation') {
      setShowInformation(false);
    }

    // Handle the snapshot popup closing if you use it
    if (popUpName === 'closeSnapshot') {
       setShowSnapshotPopUp(false);
       // Decide what to show next
    }
  };

  const handleSnapshot = () => {
    if (webcamRef.current) {
        const imageSrcDataUrl = webcamRef.current.getScreenshot();
        if (imageSrcDataUrl) {
             // Store the full data URL if you want to display it directly
             // setFrontSnapshot(imageSrcDataUrl);

             // Or extract base64 if needed for API
             const base64Image = imageSrcDataUrl.split(',')[1];
             setFrontSnapshot(base64Image); // Store only base64
             console.log('Snapshot captured (base64):', base64Image.substring(0, 30) + "...");

            // Optional: Show a snapshot confirmation popup or hide webcam
            // setShowSnapshotPopUp(true); // If you have a specific snapshot popup

             // Dummy measurement values. Replace with your own logic.
            setMeasurements({
                chest: '38 in',
                shoulder: '16 in',
                hip: '40 in',
                thigh: '22 in',
            });
            setSizes({
                us: 'M',
                uk: 'M',
                asian: 'L',
            });
        } else {
             console.error("Failed to get screenshot.");
             // Handle error, maybe show a message
        }
    } else {
        console.error("Webcam ref not available.");
        // Handle error
    }
  };
  // --- End Functions ---

  // --- JSX for this page ---
  return (
    <>
      {/* Conditional rendering based on state within this page */}

      {/* 1. Show Camera Permission Popup First */}
      {showCameraPermission && (
        <div className="popup-container">
          <div className="popup-card">
            <h4>Camera Permission</h4>
            <p>Allow camera access to get your measurements</p>
            <button onClick={() => handlePopUpClick('closeCamera')}>
              Allow Camera
            </button>
          </div>
        </div>
      )}

       {/* 2. Show Information Popup (if you sequence it) */}
       {showInformation && (
         <div className="popup-container">
            <button onClick={() => handlePopUpClick('closeInformation')}>
                Close Information
            </button>
            {/* Add information content here */}
         </div>
       )}

      {/* 3. Show Main Webcam/Measurement View */}
      {!showCameraPermission && !showInformation && !showSnapshotPopUp && (
         <div className="camera-card-container">
            {/* Webcam and Button container */}
            <div className="webcam-controls-container">
               <Webcam
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="webcam-component" // Make sure CSS matches
                  ref={webcamRef}
                  mirrored={videoConstraints.facingMode === 'user'} // Mirror if using front camera
               />
               <button onClick={handleSnapshot} className="snapshot-button">
                  Take Snapshot
               </button>
            </div>

            {/* Measurement Details Card */}
            <div className="measurement-card">
               <h4 className="card-title">Measurement Details</h4>

               {/* Display Snapshot if taken */}
               {frontSnapshot && (
                  <div className="snapshot-container">
                     {/* NOTE: Displaying raw base64 directly might not work in <img> src.
                         You need the full data URL. Store that, or reconstruct it */}
                     <img
                        src={`data:image/jpeg;base64,${frontSnapshot}`} // Reconstruct data URL
                        alt="User snapshot"
                        className="snapshot-image"
                     />
                     {/* Add Save/Upload buttons here if needed */}
                  </div>
               )}

               {/* Measurement/Size Columns */}
               <div className="measurements-split-container">
                  {/* Left Column */}
                  <div className="measurements-column">
                      <div className="measurement-item">
                        <div className="measurement-label">Chest Circumference</div>
                        <div className="measurement-value">{measurements.chest}</div>
                      </div>
                      <div className="measurement-item">
                        <div className="measurement-label">Shoulder Width</div>
                        <div className="measurement-value">{measurements.shoulder}</div>
                      </div>
                      <div className="measurement-item">
                        <div className="measurement-label">Hip Length</div>
                        <div className="measurement-value">{measurements.hip}</div>
                      </div>
                      <div className="measurement-item">
                        <div className="measurement-label">Thigh Width</div>
                        <div className="measurement-value">{measurements.thigh}</div>
                      </div>
                  </div>
                  {/* Right Column */}
                  <div className="sizes-column">
                      <div className="measurement-item">
                        <div className="measurement-label">Size in US</div>
                        <div className="measurement-value">{sizes.us}</div>
                      </div>
                      <div className="measurement-item">
                        <div className="measurement-label">Size in UK</div>
                        <div className="measurement-value">{sizes.uk}</div>
                      </div>
                      <div className="measurement-item">
                        <div className="measurement-label">Size in Asian</div>
                        <div className="measurement-value">{sizes.asian}</div>
                      </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 4. Show Snapshot Popup (if used) */}
      {showSnapshotPopUp && (
         <div className="popup-container">
            <div className="popup-card">
               <h4>Snapshot Taken</h4>
               {/* Display snapshot here too? */}
               <img
                  src={`data:image/jpeg;base64,${frontSnapshot}`}
                  alt="User snapshot"
                  className="snapshot-image" // Reuse or create specific style
                  style={{maxWidth: '80%', margin: '10px 0'}} // Example inline style
               />
               <p>Measurements have been estimated.</p>
               <button onClick={() => handlePopUpClick('closeSnapshot')}>
                  OK
               </button>
            </div>
         </div>
       )}

    </>
  );
}

export default MeasurementsPage;