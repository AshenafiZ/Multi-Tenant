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
  const page = parseInt(params.page || '1', 10) || 1;
  const limit = parseInt(params.limit || '12', 10) || 12;
  
  const filters: any = {
    page,
    limit,
  };
  
  // Only add filters if they have valid values
  if (params.location && params.location.trim()) {
    filters.location = params.location.trim();
  }
  
  if (params.minPrice) {
    const minPrice = parseFloat(params.minPrice);
    if (!isNaN(minPrice) && minPrice >= 0) {
      filters.minPrice = minPrice;
    }
  }
  
  if (params.maxPrice) {
    const maxPrice = parseFloat(params.maxPrice);
    if (!isNaN(maxPrice) && maxPrice >= 0) {
      filters.maxPrice = maxPrice;
    }
  }

  // Helper function to build pagination URL
  const buildPaginationUrl = (newPage: number): string => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', newPage.toString());
    if (params.location) searchParams.set('location', params.location);
    if (params.minPrice) searchParams.set('minPrice', params.minPrice);
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
    return `/?${searchParams.toString()}`;
  };

  let propertiesData: { data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } };
  let errorMessage: string | null = null;
  try {
    const result = await propertiesApiServer.getProperties(filters);
    propertiesData = {
      data: Array.isArray(result?.data) ? result.data : [],
      meta: result?.meta || { page: 1, limit: 12, total: 0, totalPages: 0 },
    };
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch properties. Please check if the backend server is running.';
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

      {!propertiesData.data || propertiesData.data.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
          {errorMessage ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-md mx-auto">
              <p className="text-red-800 font-medium mb-2">Error loading properties:</p>
              <p className="text-red-600 text-sm">{errorMessage}</p>
              <p className="text-gray-600 text-sm mt-2">Make sure the backend server is running at {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</p>
            </div>
          ) : (
            <p className="text-gray-600">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {propertiesData.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Pagination */}
          {propertiesData.meta && propertiesData.meta.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              {page > 1 && (
                <Link
                  href={buildPaginationUrl(page - 1)}
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
                  href={buildPaginationUrl(page + 1)}
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
