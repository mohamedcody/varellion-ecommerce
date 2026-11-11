import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customerService } from '../customer';
import * as apiModule from '../api';

describe('customerService API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches profile and unwraps data payload', async () => {
    const mockProfile = {
      userId: 'uuid-123',
      fullName: 'Ahmed Ali',
      phoneNumber: '01012345678',
      isActive: true,
    };

    vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
      success: true,
      data: mockProfile,
    });

    const result = await customerService.getProfile();
    expect(result).toEqual(mockProfile);
    expect(apiModule.requestApi).toHaveBeenCalledWith('/customer/profile');
  });

  it('updates profile and unwraps updated data', async () => {
    const updatedProfile = {
      userId: 'uuid-123',
      fullName: 'Ahmed Ali Updated',
      phoneNumber: '01198765432',
      isActive: true,
    };

    vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
      success: true,
      data: updatedProfile,
    });

    const result = await customerService.updateProfile({
      fullName: 'Ahmed Ali Updated',
      phoneNumber: '01198765432',
    });

    expect(result).toEqual(updatedProfile);
    expect(apiModule.requestApi).toHaveBeenCalledWith('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: 'Ahmed Ali Updated',
        phoneNumber: '01198765432',
      }),
    });
  });

  it('saves or updates address', async () => {
    const addressData = {
      governorate: 'Cairo',
      cityArea: 'Nasr City',
      detailedAddress: 'Abbas El Akkad St',
    };

    vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
      success: true,
      data: { ...addressData, addressId: 'addr-uuid' },
    });

    const result = await customerService.saveAddress(addressData);
    expect(result.addressId).toBe('addr-uuid');
    expect(apiModule.requestApi).toHaveBeenCalledWith('/customer/address', {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  });

  it('deletes address and returns confirmation message', async () => {
    vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
      success: true,
      message: 'تم حذف عنوان الشحن بنجاح',
    });

    const result = await customerService.deleteAddress();
    expect(result.success).toBe(true);
    expect(apiModule.requestApi).toHaveBeenCalledWith('/customer/address', {
      method: 'DELETE',
    });
  });
});
