'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{ id: string; url: string }>;
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageGallery({ images, initialIndex = 0, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Main Image */}
        <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
          <Image
            src={images[currentIndex].url}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

