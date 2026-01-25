'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageGallery from './image-gallery';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyImageGalleryProps {
  images: Array<{ id: string; url: string }>;
  propertyTitle: string;
}

export default function PropertyImageGallery({ images, propertyTitle }: PropertyImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="h-96 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="relative">
        {/* Main Image with Navigation */}
        <div className="relative h-96 w-full group">
          <Image
            src={images[currentIndex].url}
            alt={`${propertyTitle} - Image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
          />
          
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* View Gallery Button */}
          <button
            onClick={() => setSelectedImageIndex(currentIndex)}
            className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2"
          >
            <Eye className="w-5 h-5" />
            <span>View Gallery</span>
          </button>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-600 ring-2 ring-blue-300'
                    : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      {selectedImageIndex !== null && (
        <ImageGallery
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
}

