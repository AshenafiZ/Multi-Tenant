import { propertiesApiServer } from '@/lib/api/properties-server';
import PropertyCard from '@/components/property-card';
import PropertyFilters from '@/components/property-filters';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface SearchParams {
  page?: string;
  limit?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '12');
  
  const filters = {
    page,
    limit,
    status: 'published' as const,
    ...(params.location && { location: params.location }),
    ...(params.minPrice && { minPrice: parseFloat(params.minPrice) }),
    ...(params.maxPrice && { maxPrice: parseFloat(params.maxPrice) }),
  };

  let propertiesData;
  try {
    propertiesData = await propertiesApiServer.getProperties(filters);
  } catch (error) {
    propertiesData = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Available Properties</h1>
        </div>
        <p className="text-gray-600">Discover your perfect property</p>
      </div>

      <PropertyFilters />

      {propertiesData.data.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {propertiesData.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Pagination */}
          {propertiesData.meta.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              {page > 1 && (
                <Link
                  href={`/?page=${page - 1}&${new URLSearchParams(params as any).toString()}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {propertiesData.meta.totalPages}
              </span>
              {page < propertiesData.meta.totalPages && (
                <Link
                  href={`/?page=${page + 1}&${new URLSearchParams(params as any).toString()}`}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
