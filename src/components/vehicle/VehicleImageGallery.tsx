import React, { useState } from 'react';
import { VehiclePhoto } from '../../types/vehicle';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface VehicleImageGalleryProps {
  images: VehiclePhoto[];
}

export const VehicleImageGallery: React.FC<VehicleImageGalleryProps> = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is360View, setIs360View] = useState(false);

  // Sort images by order_index and ensure primary image is first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.order_index - b.order_index;
  });

  const currentImage = sortedImages[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setIs360View(false);
  };

  const toggle360View = () => {
    setIs360View(!is360View);
  };

  if (!sortedImages.length) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        {/* Main Image */}
        <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={currentImage.url}
            alt={currentImage.caption || 'Vehicle image'}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              is360View ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
            }}
          />
          
          {/* Navigation Arrows */}
          {sortedImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={previousImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={openFullscreen}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* 360° View Button (if supported) */}
          {currentImage.caption?.includes('360') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle360View}
              className="absolute top-2 left-2 bg-white/80 hover:bg-white"
            >
              360°
            </Button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {sortedImages.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {sortedImages.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Navigation in Fullscreen */}
          {sortedImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={previousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Fullscreen Image */}
          <div className="relative max-w-full max-h-full">
            <img
              src={currentImage.url}
              alt={currentImage.caption || 'Vehicle image'}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
              }}
            />
            
            {/* Image Info */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded">
              <p className="text-sm">
                {currentImage.caption || `Image ${currentImageIndex + 1}`}
              </p>
              <p className="text-xs opacity-75">
                {currentImageIndex + 1} of {sortedImages.length}
              </p>
            </div>
          </div>

          {/* Thumbnail Strip in Fullscreen */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-8 rounded overflow-hidden border transition-colors ${
                    index === currentImageIndex
                      ? 'border-white'
                      : 'border-gray-400 hover:border-gray-200'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};