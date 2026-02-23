'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { businessApi } from '@/lib/api';
import { Location } from '@/lib/types';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/modal';
import { toast } from 'sonner';
import { Plus, MapPin, Phone, Mail, Trash2, Edit, AlertCircle } from 'lucide-react';

const locationSchema = z.object({
  location_name: z.string().min(2, 'Name is required'),
  address_line1: z.string().min(3, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postcode: z.string().min(3, 'Postcode is required'),
  country: z.string().min(1, 'Country is required'),
  branch_email: z.string().email('Invalid email'),
  contact_name: z.string().min(2, 'Contact name is required'),
  contact_number: z.string().min(10, 'Enter a valid phone number'),
  is_primary: z.boolean(),
});

type LocationForm = z.infer<typeof locationSchema>;

type OpeningHour = { day: string; open_time: string; close_time: string; is_closed: boolean };

const defaultOpeningHours: OpeningHour[] = DAYS_OF_WEEK.map((day) => ({
  day,
  open_time: '09:00',
  close_time: '17:00',
  is_closed: day === 'Sunday',
}));

function LocationCard({
  location,
  onDelete,
  onEdit,
}: {
  location: Location;
  onDelete: (id: number) => void;
  onEdit: (location: Location) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#132c64]">{location.location_name}</h3>
              {location.is_primary && (
                <span className="bg-[#15cb89]/10 text-[#15cb89] text-xs px-2 py-0.5 rounded-full font-medium">
                  Primary
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(location)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(location.location_id)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>
              {location.address_line1}
              {location.address_line2 && `, ${location.address_line2}`}, {location.city},{' '}
              {location.postcode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {location.branch_email}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {location.contact_number}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationModal({
  isOpen,
  onClose,
  editLocation,
}: {
  isOpen: boolean;
  onClose: () => void;
  editLocation?: Location | null;
}) {
  const queryClient = useQueryClient();
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    editLocation?.opening_hours || defaultOpeningHours
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: editLocation
      ? {
          location_name: editLocation.location_name,
          address_line1: editLocation.address_line1,
          address_line2: editLocation.address_line2,
          city: editLocation.city,
          postcode: editLocation.postcode,
          country: editLocation.country,
          branch_email: editLocation.branch_email,
          contact_name: editLocation.contact_name,
          contact_number: editLocation.contact_number,
          is_primary: editLocation.is_primary,
        }
      : { country: 'United Kingdom', is_primary: false },
  });

  const updateHour = (idx: number, field: keyof OpeningHour, value: string | boolean) =>
    setOpeningHours((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)));

  const onSubmit = async (data: LocationForm) => {
    try {
      const payload = { ...data, opening_hours: openingHours };
      if (editLocation) {
        await businessApi.updateLocation({ ...payload, location_id: editLocation.location_id });
        toast.success('Location updated!');
      } else {
        await businessApi.createLocation(payload);
        toast.success('Location created!');
      }
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      onClose();
    } catch {
      toast.error('Failed to save location');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editLocation ? 'Edit Location' : 'Add Location'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <Input label="Location Name" error={errors.location_name?.message} {...register('location_name')} />
          <Input label="Address Line 1" error={errors.address_line1?.message} {...register('address_line1')} />
          <Input label="Address Line 2 (Optional)" {...register('address_line2')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="Postcode" error={errors.postcode?.message} {...register('postcode')} />
          </div>
          <Input label="Branch Email" type="email" error={errors.branch_email?.message} {...register('branch_email')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact Name" error={errors.contact_name?.message} {...register('contact_name')} />
            <Input label="Contact Number" type="tel" error={errors.contact_number?.message} {...register('contact_number')} />
          </div>

          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b">
              <p className="text-sm font-medium text-gray-700">Opening Hours</p>
            </div>
            {openingHours.map((hour, idx) => (
              <div key={hour.day} className="flex items-center gap-3 px-4 py-2 border-b last:border-0">
                <span className="w-20 text-sm text-gray-700">{hour.day}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={hour.is_closed}
                    onChange={(e) => updateHour(idx, 'is_closed', e.target.checked)}
                  />
                  Closed
                </label>
                {!hour.is_closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => updateHour(idx, 'open_time', e.target.value)}
                      className="border border-[#E5E7EB] rounded px-2 py-1 text-xs"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => updateHour(idx, 'close_time', e.target.value)}
                      className="border border-[#E5E7EB] rounded px-2 py-1 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editLocation ? 'Save Changes' : 'Add Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LocationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await businessApi.getLocations();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => businessApi.deleteLocation(id),
    onSuccess: () => {
      toast.success('Location deleted');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: () => toast.error('Failed to delete location'),
  });

  const locations: Location[] = data?.locations || data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#132c64]">Locations</h1>
        <Button onClick={() => { setEditLocation(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-[#15cb89] border-t-transparent" />
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No locations added yet</p>
          <Button onClick={() => setModalOpen(true)}>Add Your First Location</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc: Location) => (
            <LocationCard
              key={loc.location_id}
              location={loc}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={(loc) => { setEditLocation(loc); setModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <LocationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditLocation(null); }}
        editLocation={editLocation}
      />
    </div>
  );
}
