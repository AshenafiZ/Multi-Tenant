import { propertiesApiServer } from '@/lib/api/properties-server';
import PropertyDetailClient from '@/components/property-detail-client';
import PropertyImageGallery from '@/components/property-image-gallery';
import PropertyActions from '@/components/property-actions';
import { notFound } from 'next/navigation';
import { MapPin, DollarSign, User, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let property;
  const { id } = await params;
  try {
    property = await propertiesApiServer.getProperty(id);
  } catch (error: any) {
    if (error.response?.status === 404 || error.code === 'ERR_BAD_REQUEST') {
      notFound();
    }
    notFound();
  }

  const price = parseFloat(property.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery */}
        <PropertyImageGallery images={property.images || []} propertyTitle={property.title} />

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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="w-5 h-5" />
                  <span className="font-medium">
                    Owner: {property.owner.firstName} {property.owner.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/properties/${id}/contact`}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Contact Owner</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="prose max-w-none mb-6">
            <h2 className="text-2xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
          </div>

          {/* Contact Owner Section */}
          {property.owner && property.status === 'published' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                Contact Property Owner
              </h3>
              <p className="text-gray-600 mb-4">
                Interested in this property? Reach out to the owner directly via email or send them a message through our platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/properties/${id}/contact`}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>Contact Owner</span>
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>View Messages</span>
                </Link>
              </div>
            </div>
          )}

          <PropertyDetailClient property={property} />
          
          {/* Role-based actions */}
          <PropertyActions property={property} />
        </div>
      </div>
    </div>
  );
}

