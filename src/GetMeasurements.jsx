import React, { useEffect } from 'react';
import './App.css'; // Assuming styles are included here

function GetMeasurements() {
  // Function to access the webcam
  async function setupWebcam() {
    try {
      const video = document.getElementById('webcam-video');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await new Promise(resolve => video.onloadedmetadata = resolve);
      video.play();
    } catch (err) {
      alert("Error accessing webcam: " + err.message);
    }
  }

  // Function to cleanup the webcam when the component unmounts
  const cleanupWebcam = () => {
    const video = document.getElementById('webcam-video');
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Initialize webcam on component mount
  useEffect(() => {
    setupWebcam();

    // Cleanup webcam when the component is unmounted or when changing views
    return cleanupWebcam;
  }, []);

  // Function to generate random measurements
  function generateRandomMeasurements() {
    const measurements = {
      chest: randomInRange(85, 110),
      waist: randomInRange(70, 100),
      hips: randomInRange(90, 120),
      inseam: randomInRange(70, 90),
      shoulder: randomInRange(40, 50),
      'arm-length': randomInRange(55, 65)
    };

    Object.entries(measurements).forEach(([id, value]) => {
      document.getElementById(id).textContent = `${value} cm`;
    });
  }

  // Function to generate random numbers within a range
  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  return (
    <div className="container">
      <div className="webcam-container">
        <video id="webcam-video" autoPlay></video>
      </div>
      
      <div className="measurements-panel">
        <h1>Body Measurements</h1>
        <div className="measurements-grid">
          <div className="measurement-item">
            <div className="measurement-label">Chest</div>
            <div className="measurement-value" id="chest">--</div>
          </div>
          <div className="measurement-item">
            <div className="measurement-label">Waist</div>
            <div className="measurement-value" id="waist">--</div>
          </div>
          <div className="measurement-item">
            <div className="measurement-label">Hips</div>
            <div className="measurement-value" id="hips">--</div>
          </div>
          <div className="measurement-item">
            <div className="measurement-label">Inseam</div>
            <div className="measurement-value" id="inseam">--</div>
          </div>
          <div className="measurement-item">
            <div className="measurement-label">Shoulder</div>
            <div className="measurement-value" id="shoulder">--</div>
          </div>
          <div className="measurement-item">
            <div className="measurement-label">Arm Length</div>
            <div className="measurement-value" id="arm-length">--</div>
          </div>
        </div>
        <button className="scan-button" onClick={generateRandomMeasurements}>Scan Body</button>
      </div>
    </div>
  );
}

export default GetMeasurements;
