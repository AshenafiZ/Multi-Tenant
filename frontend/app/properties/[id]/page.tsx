import { propertiesApiServer } from '@/lib/api/properties-server';
import PropertyDetailClient from '@/components/property-detail-client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, DollarSign, User } from 'lucide-react';

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let property;
  try {
    property = await propertiesApiServer.getProperty(params.id);
  } catch (error: any) {
    if (error.response?.status === 404 || error.code === 'ERR_BAD_REQUEST') {
      notFound();
    }
    // For other errors, still show 404 to prevent exposing internal errors
    notFound();
  }

  // Note: Client component will handle access control for non-published properties

  const price = parseFloat(property.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery */}
        {property.images && property.images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
            <div className="relative h-96">
              <Image
                src={property.images[0].url}
                alt={property.title}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
            {property.images.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {property.images.slice(1, 5).map((image) => (
                  <div key={image.id} className="relative h-48">
                    <Image
                      src={image.url}
                      alt={property.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No images available</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{property.location}</span>
              </div>
              <div className="flex items-center text-blue-600 text-2xl font-bold">
                <DollarSign className="w-6 h-6 mr-1" />
                <span>{price.toLocaleString()}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {property.status}
            </span>
          </div>

          {property.owner && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">
                  Owner: {property.owner.firstName} {property.owner.lastName}
                </span>
              </div>
            </div>
          )}

          <div className="prose max-w-none mb-6">
            <h2 className="text-2xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
          </div>

          <PropertyDetailClient property={property} />
        </div>
      </div>
    </div>
  );
}

