'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/lib/types';
import { MapPin, DollarSign } from 'lucide-react';
import { useFavoriteStore } from '@/lib/favorites-store';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const favorite = isFavorite(property.id);

  const mainImage = property.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image';
  const price = parseFloat(property.price);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-2 right-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              {property.status}
            </span>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {property.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {property.description}
        </p>

        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{property.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-blue-600 font-bold">
            <DollarSign className="w-5 h-5" />
            <span>{price.toLocaleString()}</span>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(property.id);
            }}
            className={`p-2 rounded-full transition-colors ${
              favorite
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="w-5 h-5"
              fill={favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

