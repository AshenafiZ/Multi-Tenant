'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { propertiesApi } from '@/lib/api/properties';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Upload, XCircle } from 'lucide-react';
import Image from 'next/image';
import type { Property } from '@/lib/types';

const propertySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(1, 'Description is required'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(255),
  price: z.number().min(0, 'Price must be positive'),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPropertyModal({ property, onClose, onSuccess }: EditPropertyModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property.title,
      description: property.description,
      location: property.location,
      price: parseFloat(property.price),
    },
  });

  useEffect(() => {
    reset({
      title: property.title,
      description: property.description,
      location: property.location,
      price: parseFloat(property.price),
    });
  }, [property, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: { formData: PropertyFormData; images: File[] }) => 
      propertiesApi.updateProperty(property.id, data.formData, data.images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Property updated successfully!');
      setSelectedImages([]);
      setImagePreviews([]);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update property');
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    setSelectedImages([...selectedImages, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    updateMutation.mutate(
      { formData: data, images: selectedImages },
      {
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Property</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              Add More Images (up to 10, max 5MB each)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="images"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload images</span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleImageSelect}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 5MB each</p>
              </div>
            </div>
            {selectedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {property.images && property.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Current Images:</p>
                <div className="grid grid-cols-4 gap-4">
                  {property.images.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={image.url}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

