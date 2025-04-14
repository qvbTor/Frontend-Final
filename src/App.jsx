import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import Webcam from 'react-webcam';

const CALIBRATION_CAPTURE_STEPS = ['idle', 'capturing_front', 'countdown_front', 'capturing_side', 'countdown_side', 'preview'];
const CAPTURE_STEPS = ['front', 'side', 'analyzing', 'output'];
const API_ENDPOINT = 'http://127.0.0.1:5000'; // Using your specific endpoint
const COUNTDOWN_SECONDS = 5;
// Helper function to trigger download (optional, keep if needed)
const TRYON_API_ENDPOINT = 'http://192.168.254.169:8888/tryon'; // <-- REPLACE THIS
 

 const apparelData = {
    Dress: [
      'Magenta Slipdress.jpg',
      'Pink Layered Dress.jpg',
      'Back Tie Midi Dress.jpg',
      'Bow Accent Dress.jpg',
      'Gothic Cape Dress.jpg',
      'Midnight Bell Dress.jpg',
      'Ruffle Shoulder Dress.jpg',
      'Silk Champagne Gown.jpg',
      'White Tulle Dress.jpg',
      'Wine Flare Dress.jpg'
    ],
    Polos: [
      'Black Patterned Polo.jpg',
      'Brown Patterned Polo.jpg',
      'Colorblock Champion Polo.jpg',
      'Cream Polo.jpg',
      'Peach Classic Polo.jpg',
      'Pink Youth Polo.jpg',
      'Retro Stripe Polo.jpg',
      'Soft Beige Polo.png'
    ],
    Pants: [
      'Beige Chino Pants.jpg',
      'Black High Waist Pants.jpg',
      'Classic Blue Jeans.jpg',
      'Black Lounge Pants.jpg',
      'Olive Linen Pants.jpg',
      'Navy Tapered Pants.jpg',
      'Brown Cargo Pants.jpg',
      'Red Drawstring Pants.jpg',
      'Olive Cargo Pants.jpg',
      'Tan Denim Pants.jpg'
    ],

    Sweater: [
      'Blue Pinstripe Knit.jpg',
      'Brown Green Stripe Knit.jpg',
      'Charcoal Ribbed Sweater.jpg',
      'Cream Striped Knit.jpg',
      'Ivory Cable Sweater.jpg',
      'Navy Dark Sweater.jpg',
      'Navy Knit Sweater.jpg',
      'Nordic Holiday Sweater.jpg',
      'Retro Chevron Sweater.jpg',
      'Solid Green Pullover.jpg'
    ],
    TShirt: [
      'Black Dragon Wave Tee.png',
      'Bold Red Tee.jpg',
      'Cobalt Blue Tee.jpg',
      'Gray Shadow Dragon Tee.jpg',
      'Peak Green Graphic Tee.jpg'
    ]
  };


const downloadImage = (dataUrl, filename) => {
    if (!dataUrl) {
        console.error("Cannot download image, data URL is invalid.");
        return;
    }
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`Download triggered for: ${filename}`);
    } catch (error) {
        console.error("Failed to trigger image download:", error);
    }
};
const GearIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
       {/* Using a simpler gear icon that might render better */}
       <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
       <path d="M12 22a10 10 0 0 0 10-10h-2.5a7.5 7.5 0 0 1-7.5 7.5V22z"/>
       <path d="M2 12h10v10a10 10 0 0 1-10-10z"/>
       <circle cx="12" cy="12" r="3"/> {/* Center circle */}
  </svg>
);



function getClothingType(category) {
    
    switch (category) {
      case 'Dress': return 'overall';
      case 'Polos': return 'upper';
      case 'Pants': return 'lower';
      case 'Sweater': return 'upper';
      case 'TShirt': return 'upper';
      default: return null; // Or some default
    }
  }
  

function App() {
    const [currentSide, setCurrentSide] = useState(null);
    const [currentFront, setcurrentFront] = useState(null);

    const [clothingType, setClothingType] = useState(null);

    const [isTryOnLoading, setIsTryOnLoading] = useState(false);
    const [tryOnApiError, setTryOnApiError] = useState(null);
    const [tryOnResultImage, setTryOnResultImage] = useState(null); // To store the result image, if
    const [showTryOnResultModal, setShowTryOnResultModal] = useState(false); // <-- Add this state

    
    // ---For selection of Apparel--- //
    const [selectedApparel, setSelectedApparel] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Dress');
    const [selectedImage, setSelectedImage] = useState(null);
    
    
    const handleCategoryClick = (category) => {
        setSelectedCategory(category); // Update selected category
        console.log("PALDOOOOOOOOOO: ", category)
        // Determine and update clothingType
        let newClothingType = null;
         switch (category) {
           case 'Dress': newClothingType = 'overall'; break;
           case 'Polos': newClothingType = 'upper'; break;
           case 'Sweater': newClothingType = 'upper'; break;
           case 'TShirt': newClothingType = 'upper'; break;
           case 'Pants': newClothingType = 'lower'; break;
           default: newClothingType = null;
         }
         setClothingType(newClothingType);
         console.log("PALDOOOOOOOOOO: ", newClothingType)
      };
      
    // ---For Modal of Selection of Apparel--- //
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [tryOnClothImage, setTryOnClothImage] = useState(null);


    const handleTryOnApiCall = async () => {
        // Ensure we have the necessary images and the apparel path
        if (!frontSnapshot || !sideSnapshot) {
            console.error("Cannot proceed with Try On: Missing front or side snapshot.");
            setTryOnApiError("Please capture both front and side images first in 'Get Measurements'.");
            return;
        }
        if (!tryOnClothImage) {
            console.error("Cannot proceed with Try On: No apparel selected.");
            setTryOnApiError("Please select an apparel item from the Closet first.");
            return;
        }

        console.log("Initiating Try On API call...");
        setIsTryOnLoading(true);
        setTryOnApiError(null);
        setTryOnResultImage(null);

        let apparelImageBase64 = null;

        try {
            // --- Step 1 & 2: Fetch local apparel image and convert to Base64 ---
            console.log(`Fetching apparel image from path: ${tryOnClothImage}`);
            const apparelResponse = await fetch(tryOnClothImage); // Fetch using the path
            if (!apparelResponse.ok) {
                throw new Error(`Failed to fetch apparel image: ${apparelResponse.statusText}`);
            }
            const apparelBlob = await apparelResponse.blob();

            // --- Step 3: Convert Blob to Base64 Data URL ---
            const reader = new FileReader();
            // Use a Promise to wait for the FileReader result
            const readAsDataURL = (blob) => {
                return new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const apparelDataUrl = await readAsDataURL(apparelBlob);

            // --- Step 4: Extract Base64 part ---
            // Data URL format: "data:[<mediatype>];base64,[<data>]"
            apparelImageBase64 = apparelDataUrl.split(',')[1];
            console.log("Successfully converted apparel image to Base64.");
            // --- End of Image Conversion ---


            // --- Prepare payload for the Try On server ---
            const payload = {
                "person_image": frontSnapshot,
                "cloth_image": apparelImageBase64,
                // Use the key your *new* server expects for the apparel image Base64
                "cloth_type": clothingType
            };

            console.log("Sending payload (excluding image data length check) to:", TRYON_API_ENDPOINT);
            // console.log("Payload structure:", { // Log keys without large data
            //    image_front: `Base64 string length: ${frontSnapshot?.length}`,
            //    image_side: `Base64 string length: ${sideSnapshot?.length}`,
            //    apparel_image_base64: `Base64 string length: ${apparelImageBase64?.length}`
            // });


            // --- Make the API call to the Try On server ---
            const response = await fetch(TRYON_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Or 'image/*' if it returns image directly
                },
                body: JSON.stringify(payload)
            });

             if (!response.ok) {
                let errorDetails = `HTTP error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.error || errorData.message || errorDetails;
                } catch (e) { /* Ignore if response isn't JSON */ }
                throw new Error(errorDetails);
            }

            // --- Handle the successful response (as before) ---
            const result = await response.json();
            console.log("Try On API response:", result);
            if (result.result_image) { // Adjust key based on actual response
                 setTryOnResultImage(`data:image/jpeg;base64,${result.result_image}`);
                 setShowTryOnResultModal(true);
                 // Removed alert, result display is sufficient
            } else {
                 console.warn("Try On API response received, but no result image found.");
                 setTryOnApiError("Received response, but couldn't process result image.");
            }

        } catch (error) {
            console.error("Try On process failed (could be image fetch or API call):", error);
            // Provide a more specific error if it happened during image fetch
            if (!apparelImageBase64 && error.message.includes('fetch apparel image')) {
                 setTryOnApiError(`Error loading selected apparel: ${error.message}`);
            } else {
                 setTryOnApiError(error.message || 'Failed to connect or process Try On request.');
            }
        } finally {
            setIsTryOnLoading(false);
        }
    };


    const handleRetake = () => {
        console.log("Retake Images button pressed. Navigating to Get Measurements.");
        // Reset the capture process state for a fresh start
        resetCaptureProcess();
        // Navigate back to the Get Measurements tab
        setSelectedMenu('Get Measurements');
        // Clear any previous try-on results/errors
        setTryOnApiError(null);
        setTryOnResultImage(null);
    };

    const videoConstraints = {
        width: 1024,
        height: 768,
        facingMode: "user"
    };
    const webcamRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const [measurements, setMeasurements] = useState({'Chest Circumference': '---', 'Shoulder Width': '---', 'Hip Circumference': '---','Waist Circumference': '---', 'Thigh Circumference': '---' });
    const [sizes, setSizes] = useState({ 'western': '---', 'european': '---', 'asian': '---' });
    const [selectedMenu, setSelectedMenu] = useState('Home');
    const [showCameraPermission, setShowCameraPermission] = useState(false);
    
    const [captureStep, setCaptureStep] = useState(CAPTURE_STEPS[0]);
    const [frontSnapshot, setFrontSnapshot] = useState(null); // Base64 string
    const [sideSnapshot, setSideSnapshot] = useState(null);   // Base64 string
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null); // State to hold API errors

    const [profiles, setProfiles] = useState([
      {
          id: 1678886400001, // Use unique IDs
          generatedImg: 'https://via.placeholder.com/300/4AAE9B/ffffff?text=Profile+1', // Placeholder image URL
          Measurements: { chest: '38 in', shoulder: '16 in', hip: '40 in', thigh: '22 in' },
          Sizes: { us: 'M', uk: 'M', asian: 'L' }
      },
      {
          id: 1678886400002,
          generatedImg: 'https://via.placeholder.com/300/F19C79/ffffff?text=Profile+2', // Placeholder image URL
          Measurements: { chest: '40 in', shoulder: '17 in', hip: '42 in', thigh: '23 in' },
          Sizes: { us: 'L', uk: 'L', asian: 'XL' }
      },
      // Add more profiles if needed
  ]);

    const [selectedProfile, setSelectedProfile] = useState(null); // Track which profile is selected for modal
    // --- NEW State for Calibration ---
    const [isCalibrating, setIsCalibrating] = useState(false); // Are we in calibration mode?
    const [calibrationStep, setCalibrationStep] = useState(CALIBRATION_CAPTURE_STEPS[0]); // idle, capturing_front, etc.
    const [frontCalibrationSnap, setFrontCalibrationSnap] = useState(null); // front_snap
    const [sideCalibrationSnap, setSideCalibrationSnap] = useState(null);   // side_snap
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [showCalibrationPreview, setShowCalibrationPreview] = useState(false);
    const [isCalibrationLoading, setIsCalibrationLoading] = useState(false); // Calibration API loading
    const [calibrationApiError, setCalibrationApiError] = useState(null);   // Calibration API error

    useEffect(() => {
      // Clear interval when component unmounts or when step changes away from countdown
      return () => {
          if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
          }
      };
  }, []); // Run only on mount and unmount


    // --- Event Handlers ---
    const handleSelectProfile = (profile) => {
        setSelectedProfile(profile); // Set the profile to show in the modal
    };

    const handleCloseModal = () => {
        setSelectedProfile(null); // Clear selection to close modal
    };

    const handleCloseTryOnResultModal = () => {
        setShowTryOnResultModal(false);
        // Optionally clear the result image when closing
        // setTryOnResultImage(null);
    };

    const handleTryAnotherOutfit = () => {
        setShowTryOnResultModal(false); // Close the modal
        setTryOnResultImage(null);      // Clear the previous result
        setTryOnClothImage(null);       // Clear the selected cloth for Try On section display
        setSelectedApparel(null);     // Clear the selected apparel path
        setSelectedImage(null);         // Clear the selected image filename
        setSelectedMenu('Closet');      // Navigate back to the Closet tab
    };



    const handleDeleteProfile = (profileIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this profile?")) {
            setProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileIdToDelete));
            setSelectedProfile(null);
        }
    };

    // Handler for the "Add New" card click
    const handleAddNewProfileClick = () => {
        // In your full app, this would likely call handleMenuClick('Get Measurements')
        // or trigger whatever starts the profile creation flow.
        console.log("Add New Profile card clicked!");
        alert("Navigate to 'Get Measurements' or start profile creation flow here.");
        // Example: handleMenuClick('Get Measurements'); // (If handleMenuClick exists here)
    };

    const handleMenuClick = (menuItem) => {
      // Reset calibration mode if navigating away
      if (isCalibrating && menuItem !== 'Get Measurements') {
          resetCalibrationState();
          setIsCalibrating(false);
      }
      if (menuItem === 'Get Measurements') {
          // Reset regular measurement process if not already calibrating
          if (!isCalibrating) {
               setShowCameraPermission(true);
               resetCaptureProcess();
          }
      }
       // Close profile modal if navigating away
       if (selectedProfile && (menuItem !== 'Closet' && menuItem !== 'Try On')) {
          handleCloseModal();
      }
      setSelectedMenu(menuItem);
  };


    const handlePopUpClick = (popUpName) => {
        if (popUpName === 'camera') {
            setShowCameraPermission(true);
        }
        if (popUpName === 'closeCamera') {
            setShowCameraPermission(false);
            setCaptureStep(CAPTURE_STEPS[0]);
        }
    };

    const handleCardClick = (cardName) => {
        handleMenuClick(cardName);
    };

    // --- Make handleSnapshot async and add full fetch logic ---
    const handleSnapshot = async () => { // <-- Added async keyword
        if (!webcamRef.current) {
            console.error("Webcam ref not available.");
            return;
        }
        const imageSrcDataUrl = webcamRef.current.getScreenshot();
        if (!imageSrcDataUrl) {
            console.error("Failed to get screenshot.");
            return;
        }

        const base64Image = imageSrcDataUrl.split(',')[1];
        const timestamp = Date.now();
        setApiError(null); // Clear previous errors on new snapshot attempt

        if (captureStep === 'front') {
            console.log("Capturing Front View Snapshot...");    
            setFrontSnapshot(base64Image);
            setCaptureStep(CAPTURE_STEPS[1]);
            // Optional: Trigger download
            // downloadImage(imageSrcDataUrl, `front_snapshot_${timestamp}.jpg`);

        } else if (captureStep === 'side') {
            console.log("Capturing Side View Snapshot...");
            setSideSnapshot(base64Image); // Store side snapshot Base64
            setCaptureStep(CAPTURE_STEPS[2]); // Move to 'analyzing' UI state
            setIsLoading(true); // Show loading indicator

            // Optional: Trigger download
            // downloadImage(imageSrcDataUrl, `side_snapshot_${timestamp}.jpg`);

            const payload = {
                "image_front": frontSnapshot, // Use state for front image
                "image_side": base64Image      // Use current capture for side image
            };
            setcurrentFront(frontSnapshot) 
            setCurrentSide(base64Image) 

            console.log("Sending images to backend:", API_ENDPOINT);

            // --- Add try/catch/finally for API call ---
            try {
                const response = await fetch(API_ENDPOINT + "/measure", { // Use await
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                // --- Handle Response ---
                if (!response.ok) {
                    // Try to get more specific error message from backend if possible
                    let errorDetails = response.statusText;
                    try {
                         const errorData = await response.json();
                         errorDetails = errorData.error || errorData.message || errorDetails;
                    } catch (e) { /* Ignore if response body isn't valid JSON */ }
                    throw new Error(`HTTP error ${response.status}: ${errorDetails}`);
                }

                const result = await response.json(); // Parse JSON response
                console.log("API response:", result);
                // *** Adapt this based on your ACTUAL API response structure ***
                if (result) { // Check if expected data exists
                    console.log("Analysis successful:", result);
                    setMeasurements(result.measurements_cm);
                    setSizes(result.recommended_sizing);
                    setCaptureStep(CAPTURE_STEPS[3]); // Move to 'output' step
                    profiles.push({frontImage: payload['image_front'], Measurements: result.measurements_cm});

                } else {
                    // Handle cases where response is OK but data format is wrong or indicates failure
                     console.error("Analysis failed or unexpected response format:", result);
                    throw new Error(result.error || 'Analysis failed. Unexpected response from backend.');
                }
                console.log(result.measurements_cm);
                console.log(result.measurements_cm['Chest Circumference']);

            } catch (error) {
                console.error("API request failed:", error);
                setApiError(error.message || 'Failed to connect or process request.'); // Set error message state
                setCaptureStep(CAPTURE_STEPS[2]); // Stay in analyzing step to show error
            } finally {
                setIsLoading(false); // Hide loading indicator regardless of success/failure
            }
            // --- End API Request Handling ---
        }
    };
    // --- End handleSnapshot ---

    const getButtonText = () => {
        if (captureStep === 'front') return 'Take Front Snapshot';
        if (captureStep === 'side') return 'Take Side Snapshot';
        if (captureStep === 'analyzing' && isLoading) return 'Processing...';
        if (captureStep === 'analyzing' && apiError) return 'Error Occurred'; // Optional text on error
        return 'Processing...'; // Default for analyzing/output
    };

    const isButtonDisabled = () => {
        // Disable button if loading, or if analyzing/output step is reached
        return isLoading || captureStep === 'analyzing' || captureStep === 'output';
    };

    const resetCaptureProcess = () => {
        setCaptureStep(CAPTURE_STEPS[0]);
        setFrontSnapshot(null);
        setSideSnapshot(null);
        setMeasurements({ chest: '---', shoulder: '---', hip: '---', thigh: '---' });
        setSizes({ us: '---', uk: '---', asian: '---' });
        setIsLoading(false);
        setApiError(null); // Reset error state
    };

    const resetCalibrationState = () => {
      setCalibrationStep(CALIBRATION_CAPTURE_STEPS[1]); // Start at capturing_front
      setFrontCalibrationSnap(null);
      setSideCalibrationSnap(null);
      setCountdown(COUNTDOWN_SECONDS);
      setShowCalibrationPreview(false);
      setIsCalibrationLoading(false);
      setCalibrationApiError(null);
      if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
    };
    const handleStartCalibration = () => {
      setShowCameraPermission(false); // Ensure regular permission popup is hidden
      resetCalibrationState();
      setIsCalibrating(true);
    };
    const handleGoBackFromCalibration = () => {
      resetCalibrationState();
      setIsCalibrating(false);
      // Optionally show measurement permission popup again if needed
      // setShowCameraPermission(true);
      // resetCaptureProcess();
    };

    const startCountdown = (viewType) => { // 'front' or 'side'
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); // Clear any existing interval

        setCalibrationStep(viewType === 'front' ? 'countdown_front' : 'countdown_side');
        setCountdown(COUNTDOWN_SECONDS);

        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prevCount => {
                if (prevCount <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                    captureCalibrationImage(viewType); // Capture image when countdown finishes
                    return COUNTDOWN_SECONDS; // Reset for potential next use
                }
                return prevCount - 1;
            });
        }, 1000);
    };

    const captureCalibrationImage = (viewType) => {
        // Use the same webcam ref for both measurement and calibration for simplicity
        const currentWebcamRef = webcamRef; // Or use calibrationWebcamRef if you defined it
        
        if (!currentWebcamRef.current) {
            console.error("Calibration Webcam ref not available.");
            setCalibrationApiError("Webcam not ready.");
            setCalibrationStep('capturing_' + viewType); // Go back to capture step
            return;
        }
        const imageSrcDataUrl = currentWebcamRef.current.getScreenshot();
        if (!imageSrcDataUrl) {
            console.error("Failed to get calibration screenshot.");
            setCalibrationApiError("Failed to capture image.");
            setCalibrationStep('capturing_' + viewType); // Go back to capture step
            return;
        }

        const base64Image = imageSrcDataUrl.split(',')[1];
        console.log(`Captured ${viewType} calibration image.`);

        if (viewType === 'front') {
            setFrontCalibrationSnap(base64Image);
            setCalibrationStep('capturing_side'); // Move to next step
        } else if (viewType === 'side') {
            setSideCalibrationSnap(base64Image);
            setCalibrationStep('preview'); // All captures done, move to preview
            setShowCalibrationPreview(true);
        }
    };

  const handleCalibrationCaptureClick = () => {
      if (calibrationStep === 'capturing_front') {
          startCountdown('front');
      } else if (calibrationStep === 'capturing_side') {
          startCountdown('side');
      }
  };

  const handleRetakeCalibration = () => {
      setShowCalibrationPreview(false);
      resetCalibrationState(); // Start over from front capture
  };


  const handleCalibrateApiCall = async () => {
    if (!frontCalibrationSnap || !sideCalibrationSnap) {
        console.error("Missing calibration images for API call.");
        setCalibrationApiError("Missing images. Please retake.");
        return;
    }

    setShowCalibrationPreview(false); // Close preview modal
    setIsCalibrationLoading(true);
    setCalibrationApiError(null);

    const payload = {
        "image_calibrate_front": frontCalibrationSnap,
        "image_calibrate_side": sideCalibrationSnap
    };
    console.log(frontCalibrationSnap);
    console.log(sideCalibrationSnap);
    console.log("Sending images to /calibrate endpoint:", API_ENDPOINT);

    try {
        const response = await fetch(API_ENDPOINT + "/calibrate", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
             let errorDetails = response.statusText;
             try { const errorData = await response.json(); errorDetails = errorData.error || errorData.message || errorDetails; } catch (e) { /* ignore */ }
             throw new Error(`Calibration failed: ${response.status} ${errorDetails}`);
        }

        const result = await response.json(); // Assuming backend sends some confirmation
        console.log("Calibration API success:", result);
        alert("Calibration successful!"); // Simple feedback
        // Optionally go back to measurement view or home
        handleGoBackFromCalibration();

    } catch (error) {
        console.error("Calibration API request failed:", error);
        setCalibrationApiError(error.message || 'Failed to send calibration data.');
         // Don't automatically reset, let user see error and decide
         // maybe set step back to preview?
         // setShowCalibrationPreview(true); // Reopen preview to show error? Or display error elsewhere
         setCalibrationStep('preview'); // Allow retake or re-calibrate attempt
    } finally {
        setIsCalibrationLoading(false);
    }
};



    return (
      <div className="app-container">
          {/* Menu */}
           <div className="menu-container">
               <ul>
                <li className={selectedMenu === 'Home' ? 'active' : ''} onClick={() => handleMenuClick('Home')}>Home</li>
                <li className={selectedMenu === 'Get Measurements' ? 'active' : ''} onClick={() => handleMenuClick('Get Measurements')}>Get Measurements</li>
                {/* Corrected Order/Name based on your code */}
                <li className={selectedMenu === 'Closet' ? 'active' : ''} onClick={() => handleMenuClick('Closet')}>Closet</li>
                <li className={selectedMenu === 'Try On' ? 'active' : ''} onClick={() => handleMenuClick('Try On')}>Try On</li>
              </ul>
          </div>

          {/* Content Container */}
          <div className="content-container">

              {/* Home Section */}
              {selectedMenu === 'Home' && (
                   <>
                   <h2 className="page-title">Pixel Fit</h2>
                   <div className="card-grid">
                     <div className="measurement-card" onClick={() => handleCardClick('Get Measurements')}>
                       <h4 className="card-title">Auto Measurements</h4>
                       <img src="/src/assets/Untitled.png" alt="MeasurementPNG" className="card-img"/>
                       <div className="card-text"><p>Get your measurements...</p></div>
                     </div>
                     <div className="measurement-card" onClick={() => handleCardClick('Try On')}>
                        <h4 className="card-title">Virtual Try On</h4>
                        <img src="/src/assets/virtualtryonclipart.png" alt="Try On Clipart" className="card-img"/>
                        <div className="card-text"><p>Visualize and virtually try on...</p></div>
                     </div>
                     <div className="measurement-card" onClick={() => handleCardClick('Closet')}>
                        <h4 className="card-title">Our Closet</h4>
                        <img src="/src/assets/closetclippart.png" alt="closetclipart" className="card-img"/>
                        <div className="card-text"><p>Explore a wide range...</p></div>
                      </div>
                   </div>
                 </>
               )}


              {/* Get Measurements Section - CONDITIONAL RENDERING */}
              {selectedMenu === 'Get Measurements' && !isCalibrating && (
                  <>
                      {/* --- Gear Icon --- */}
                      <button className="calibration-gear-button" onClick={handleStartCalibration} title="Calibrate Camera">
                          <GearIcon />
                      </button>
                      {/* --- End Gear Icon --- */}

                      {/* Measurement Permission Popup */}
                      {showCameraPermission && (
                          <div className="popup-container">
                              <div className="popup-card">
                                  <h4 className="popup-title">Camera Permission</h4>
                                  <p className='popup-text'>Allow camera access to get your measurements</p>
                                  <button onClick={() => handlePopUpClick('closeCamera')}>Allow Camera</button>
                              </div>
                          </div>
                      )}

                      {/* Measurement Capture View */}
                      {!showCameraPermission && (
                          <div className="capture-process-container">
                              <div className="step-indicator">
                                  <p className={`step-item ${captureStep === 'front' ? 'step-active' : ''}`}>Front View</p>
                                  <p className={`step-item ${captureStep === 'side' ? 'step-active' : ''}`}>Side View</p>
                                  <p className={`step-item ${captureStep === 'analyzing' ? 'step-active' : ''}`}>Analyzing</p>
                                  <p className={`step-item ${captureStep === 'output' ? 'step-active' : ''}`}>Output</p>
                              </div>
                              <div className="webcam-and-results-area">
                                  {(captureStep === 'front' || captureStep === 'side') && (
                                      <>
                                          <div className="webcam-container"><Webcam {...videoConstraints} screenshotFormat="image/jpeg" className="webcam-component" ref={webcamRef} mirrored={videoConstraints.facingMode !== 'environment'} /></div>
                                          <button onClick={handleSnapshot} className="snapshot-button" disabled={isButtonDisabled()}>{getButtonText()}</button>
                                      </>
                                  )}
                                  {(captureStep === 'analyzing' || captureStep === 'output') && (
                                      <div className="measurement-card measurement-card-results">
                                          <h4 className="card-title">Measurement Details</h4>
                                          {apiError && captureStep === 'analyzing' && ( <div className="api-error-message"><p><strong>Error:</strong> {apiError}</p><button onClick={resetCaptureProcess} className="start-over-buttoner">Try Again</button></div> )}
                                          {(!apiError || captureStep === 'output') && ( <div className="measurements-split-container">
                                            
                                            <div className="measurements-column">
                                            <h5 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Measurements (cm)</h5>
                                            {measurements && Object.keys(measurements).length > 0 ? (
                                                Object.entries(measurements).map(([key, value]) => (
                                                    <div className="measurement-item" key={`meas-${key}`}>
                                                        <div className="measurement-label">{key.replace(/_/g, ' ')}</div> {/* Replace underscores if any */}
                                                        <div className="measurement-value">
                                                            {/* Format number if it's not '---', otherwise display '---' */}
                                                            {value !== '---' && !isNaN(parseFloat(value))
                                                                ? parseFloat(value).toFixed(1) + ' cm'
                                                                : '---'}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                // Optional: Show placeholders or loading state if needed
                                                // You could map over your initial state keys here for placeholders
                                                Object.keys({'Chest Circumference': '---', 'Shoulder Width': '---', 'Hip Circumference': '---', 'Waist Circumference': '---', 'Thigh Circumference': '---' }).map(key => (
                                                    <div className="measurement-item measurement-item-empty" key={`meas-placeholder-${key}`}>
                                                        <div className="measurement-label">{key}</div>
                                                        <div className="measurement-value">---</div>
                                                    </div>
                                                ))
                                            )}
                                                
                                                
                                                </div>
                                            
                                            
                                            <div className="sizes-column">
                                                                    <h5 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Recommended Sizes</h5>
                                            {sizes && Object.keys(sizes).length > 0 ? (
                                                Object.entries(sizes).map(([key, value]) => (
                                                    <div className="measurement-item" key={`size-${key}`}>
                                                        {/* Capitalize region name */}
                                                        <div className="measurement-label">{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</div>
                                                        <div className="measurement-value">{value !== '---' ? value : '---'}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                // Optional: Placeholders for sizes
                                                Object.keys({ 'western': '---', 'european': '---', 'asian': '---' }).map(key => (
                                                    <div className="measurement-item measurement-item-empty" key={`size-placeholder-${key}`}>
                                                        <div className="measurement-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                                                        <div className="measurement-value">---</div>
                                                    </div>
                                                ))
                                            )}



                                            </div>
                                            
                                            </div>
                                        
                                        )}
                                          {captureStep === 'output' && !apiError && ( <button onClick={resetCaptureProcess} className="start-over-button">Start Over</button> )}
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Measurement Loading Modal */}
                      {isLoading && ( <div className="loading-modal-overlay"><div className="loading-modal-content"><p>Analyzing Images...</p><div className="spinner"></div></div></div> )}
                  </>
              )}

              {/* --- Calibration Section --- */}
              {selectedMenu === 'Get Measurements' && isCalibrating && (
                  <div className="calibration-container">
                      <div className="calibration-header">
                            <h2 className="page-title">Calibration</h2>
                            
                      </div>

                      {/* Calibration Loading */}
                      {isCalibrationLoading && ( <div className="calibration-loading-message"><div className="spinner"></div><p>Sending calibration data...</p></div> )}

                      {/* Calibration Error */}
                        {calibrationApiError && !isCalibrationLoading && (
                          <div className="api-error-message calibration-error">
                              <p><strong>Error:</strong> {calibrationApiError}</p>
                              <button onClick={handleGoBackFromCalibration} className="back-button">Back to Measurements</button> 
                              <button onClick={handleCalibrateApiCall} className='retry-button' disabled={!frontCalibrationSnap || !sideCalibrationSnap}>Retry Calibrate</button>
                              <button onClick={handleRetakeCalibration} className='start-over-button'>Retake Images</button>
                              
                          </div>
                        )}

                      {/* Calibration Webcam & Controls */}
                        {!isCalibrationLoading && !calibrationApiError && (calibrationStep === 'capturing_front' || calibrationStep === 'capturing_side' || calibrationStep === 'countdown_front' || calibrationStep === 'countdown_side') && (
                          <div className="calibration-webcam-area">
                              <div className="webcam-container calibration-webcam-container">
                                    {(calibrationStep === 'countdown_front' || calibrationStep === 'countdown_side') && ( <div className="countdown-overlay"><span className="countdown-number">{countdown}</span></div> )}
                                  <Webcam {...videoConstraints} audio={false} screenshotFormat="image/jpeg" className="webcam-componente" ref={webcamRef} mirrored={videoConstraints.facingMode !== 'environment'}/>
                              </div>
                              <button onClick={handleCalibrationCaptureClick} className="calib-button" disabled={calibrationStep === 'countdown_front' || calibrationStep === 'countdown_side'}>
                                  {calibrationStep === 'capturing_front' && 'Capture Front Calibration'}
                                  {calibrationStep === 'capturing_side' && 'Capture Side Calibration'}
                                  {(calibrationStep === 'countdown_front' || calibrationStep === 'countdown_side') && 'Capturing...'}
                              </button>

                          </div>
                          
                        )}

                  </div>
              )}
              {/* --- END Calibration Section --- */}

              {/* Closet Section --- CORRECTED SYNTAX --- */}
              {/* Closet Section */}
        {selectedMenu === 'Closet' && (
  <>
    <h2 className="page-title">Closet</h2>

    {/* Category Tabs */}
    <div className="category-tabs">
      {['Dress', 'Polos', 'Pants', 'Sweater', 'TShirt'].map((category) => (
        <button
          key={category}
          className={`category-button ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category)}

        >
          {category}
        </button>
      ))}
    </div>

    {/* Apparel Selection Grid */}
    <div className="closet-grid">
      {apparelData[selectedCategory].map((img, index) => {
        const path = `/src/assets/closet/${selectedCategory.toLowerCase()}/${img}`;
        const displayName = img.replace(/\.(png|jpg|jpeg)$/i, '');
        return (
          <div
            key={index}
            className={`closet-item ${selectedImage === img ? 'selected' : ''}`}
            onClick={() => {
              setSelectedImage(img);
              setSelectedApparel(path);
              setShowPreviewModal(true); // show preview modal
            }}
          >
            <div className="closet-image-wrapper">
              <img src={path} alt={img} className="closet-thumbnail" />
              <div className="closet-overlay">Select</div>
            </div>
            <div className="closet-label">{displayName}</div>
          </div>
        );
      })}
    </div>

    {/* Apparel Preview Modal */}
    {showPreviewModal && selectedApparel && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={() => setShowPreviewModal(false)}>×</button>
          <img src={selectedApparel} alt="Selected Apparel" className="modal-image" />
          <h3 className="modal-title">{selectedImage.replace(/\.(png|jpe?g)$/i, '')}</h3>
          <div className="modal-sizes">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
              <span key={size} className="size-badge">{size}</span>
            ))}
          </div>
          <button
            className="try-on-button"
            onClick={() => {
              setTryOnClothImage(selectedApparel);
              setShowPreviewModal(false);
              setSelectedMenu('Try On');
            }}
          >
            Try-On
          </button>
        </div>
      </div>
    )}
  </>
        )}

        {/* Try On Section */}
            {/* Try On Section - Updated */}
            {selectedMenu === 'Try On' && (
                    <div className="tryon-container"> {/* Use a container class */}
                        <h2 className="page-title">Try On Preview</h2>

                        {/* Conditional Display: Show images or prompt */}
                        {(frontSnapshot && sideSnapshot) ? (
                        <>
                            {/* Image Display Area */}
                            <div className="tryon-image-container">
                            <div className="tryon-image-itemer apparel-item">
                            <h4>Apparel</h4>
                            {tryOnClothImage ? (
                            <img
                                src={tryOnClothImage} // Use the state variable holding the apparel path
                                alt="Selected Apparel Preview"
                                className="tryon-image-pakang apparel-image" // Added specific class
                            />
                            ) : (
                            <div className="tryon-image-placeholder"> {/* Placeholder style */}
                                <p>Select apparel from Closet</p>
                            </div>
                    )}
                            </div>
                            <div className="tryon-image-item">
                                <h4>Front View</h4>
                                <img
                                src={`data:image/jpeg;base64,${frontSnapshot}`}
                                alt="Front Snapshot Preview"
                                className="tryon-image"
                                />
                            </div>
                            <div className="tryon-image-item">
                                <h4>Side View</h4>
                                <img
                                src={`data:image/jpeg;base64,${sideSnapshot}`}
                                alt="Side Snapshot Preview"
                                className="tryon-image"
                                />
                            </div>


                            </div>

                            {/* Action Buttons Area */}
                            <div className="tryon-actions">
                            <button
                                onClick={handleRetake}
                                className="retake-button start-over-button" // Reuse existing styles if suitable
                                disabled={isTryOnLoading} // Disable while loading Try On
                            >
                                Retake Images
                            </button>
                            <button
                                onClick={handleTryOnApiCall}
                                className="try-on-button calibrate-button" // Reuse existing styles if suitable
                                disabled={isTryOnLoading} // Disable while loading
                            >
                                {isTryOnLoading ? 'Processing Try On...' : 'Try On'}
                            </button>
                            </div>

                            {/* Loading Indicator for Try On */}
                            {isTryOnLoading && (
                            <div className="loading-indicator" style={{ marginTop: '20px', textAlign: 'center' }}>
                                <div className="spinner"></div>
                                <p>Generating Try On result...</p>
                            </div>
                            )}

                            {/* Error Display for Try On */}
                            {tryOnApiError && (
                            <div className="api-error-message" style={{ marginTop: '20px', textAlign: 'center', color: '#f55858' }}>
                                <p><strong>Try On Error:</strong> {tryOnApiError}</p>
                                {/* Optionally add a retry button here if needed */}
                            </div>
                            )}

                            {/* Display Try On Result Image */}
                                          {tryOnResultImage && !isTryOnLoading && !tryOnApiError && (
                                              <div className="tryon-result-container" style={{ marginTop: '30px', textAlign: 'center' }}>
                                                 <h3 className="page-title" style={{fontSize: '1.5rem', borderBottom: 'none', marginBottom: '15px'}}>Try On Result</h3>
                                               
                                             </div>
                                          )}

                                        </>
                                        ) : (

                        <div className="tryon-prompt" style={{ marginTop: '30px', textAlign: 'center' }}>
                            <p>Please capture your front and side images using the 'Get Measurements' tab first.</p>
                            <button onClick={() => setSelectedMenu('Get Measurements')} className="snapshot-button" style={{ marginTop: '15px' }}>
                            Go to Get Measurements
                            </button>
                        </div>
                        )}
                    </div>
                    )}
        {/* --- End of Updated Try On Section --- */}

          </div> {/* End content-container */}
                      {/* Profile Details Modal */}
                      {selectedProfile && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    {/* ... Profile Modal content ... */}
                     <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                         <button className="modal-close-button" onClick={handleCloseModal}>×</button>
                         <h2>Profile Details</h2>
                         <div className="modal-body">
                             <div className="modal-image-container"><img src={selectedProfile.frontImage && selectedProfile.frontImage.startsWith('http') ? selectedProfile.frontImage : `data:image/jpeg;base64,${selectedProfile.frontImage}`} alt={`Profile ${selectedProfile.id} Full`} className="modal-image"/></div>
                             <div className="modal-details-container"><h4>Measurements</h4><ul>{Object.entries(selectedProfile.measurements || {}).map(([k, v]) => (<li key={`m-${k}`}><strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> {v}</li>))}</ul><h4>Sizes</h4><ul>{Object.entries(selectedProfile.sizes || {}).map(([k, v]) => (<li key={`s-${k}`}><strong>{k.toUpperCase()}:</strong> {v}</li>))}</ul></div>
                         </div>
                         <div className="modal-footer"><button className="modal-delete-button" onClick={() => handleDeleteProfile(selectedProfile.id)}>Delete Profile</button></div>
                     </div>
                </div>
             )}
             

             {/* Calibration Preview Modal */}
             {showCalibrationPreview && !isCalibrationLoading && (
                <div className="modal-overlay calibration-preview-overlay">
                    <div className="modal-content calibration-preview-content">

                         {calibrationApiError && ( <div className="api-error-message" style={{marginBottom: '15px'}}><p><strong>Error:</strong> {calibrationApiError}</p></div> )}
                         <div className="calibration-preview-images">
                             <div className="preview-image-item"><h4>Front View</h4><img src={`data:image/jpeg;base64,${frontCalibrationSnap}`} alt="Front Cal Preview"/></div>
                             <div className="preview-image-item"><h4>Side View</h4><img src={`data:image/jpeg;base64,${sideCalibrationSnap}`} alt="Side Cal Preview"/></div>
                         </div>
                         <div className="calibration-preview-actions modal-footer">
                             <button className="retake-button start-over-button" onClick={handleRetakeCalibration}>Retake</button>
                             <button className="calibrate-button" onClick={handleCalibrateApiCall} disabled={isCalibrationLoading}>{isCalibrationLoading ? 'Calibrating...' : 'Calibrate'}</button>
                             
                         </div>
                         <button onClick={handleGoBackFromCalibration} className="back-button">Back to Measurements</button>
                    </div>
                </div>
             )}
      
        {showTryOnResultModal && tryOnResultImage && (
            <div className="modal-overlay tryon-result-overlay" onClick={handleCloseTryOnResultModal}>
              {/* Add specific class to modal content for targeted styling */}
              <div className="modal-content tryon-result-modal-content" onClick={(e) => e.stopPropagation()}>
  
                {/* Close Button */}
                <button className="modal-close" onClick={handleCloseTryOnResultModal}>×</button>
  
                {/* Modal Title */}
                <h2 className="modal-title tryon-result-title">Virtual Try-On Result</h2>
  
                {/* Image Display Area */}
                <div className="tryon-result-display-area">
                  {/* Main Result Image (Large) */}
                  <div className="tryon-result-image-main-wrapper">
                    <img
                      src={tryOnResultImage}
                      alt="Virtual Try On Result"
                      className="tryon-result-image-main"
                    />
                     <p className="image-label">Result</p>
                  </div>
  
                  {/* Comparison Images (Smaller, Side Panel) */}
                  <div className="tryon-result-comparison-wrapper">
                    {/* Original Person */}
                    {frontSnapshot && (
                      <div className="comparison-item">
 

                     </div>
                    )}
                    {/* Original Apparel */}
                    {tryOnClothImage && (
                      <div className="comparison-item">
                       
                      </div>
                    )}
                  </div>
                </div>
  
                {/* Modal Footer Actions */}
                <div className="modal-footer tryon-result-footer">
                  {/* Reuse existing button styles or create new ones */}
                  <button
                    className="category-button try-another-button" // Reusing category style
                    onClick={handleTryAnotherOutfit}
                  >
                    Try Another Outfit
                  </button>
                  {/* <button
                    className="snapshot-button close-result-button" // Reusing snapshot style
                    onClick={handleCloseTryOnResultModal}
                  >
                    Close
                  </button> */}
                </div>
  
              </div> {/* End modal-content */}
            </div> /* End modal-overlay */
          )}
            
  
        </div> // End app-container
      );
            




}

export default App;

