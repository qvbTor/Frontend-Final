{/* Closet Section */}
{selectedMenu === 'Closet' && (
    <>
      <h2 className="page-title">Closet</h2>
  
      {/* Category Tabs */}
      <div className="category-tabs">
        {['Dress', 'Polos', 'Pants', 'Shorts', 'Sweater', 'TShirt'].map((category) => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
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
          {selectedMenu === 'Try On' && (
        <div style={{ textAlign: 'center' }}>
          <h2 className="page-title">Try On</h2>
          {tryOnClothImage ? (
            <img src={tryOnClothImage} alt="Selected Apparel" style={{ maxWidth: '400px', marginTop: '20px', borderRadius: '10px' }} />
          ) : (
            <p>No apparel selected yet. Please choose one from the Closet.</p>
          )}
        </div>
    )}