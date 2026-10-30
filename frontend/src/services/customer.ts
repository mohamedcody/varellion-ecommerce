import { requestApi } from './api';
import { ApiResponse, Customer, CustomerAddress } from '@/types';

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string;
}

/**
 * Customer Profile & Address Service Layer
 * Directly integrated with real Spring Boot backend (/api/customer)
 */
export const customerService = {
  /**
   * Retrieves profile and delivery address for the authenticated customer
   */
  async getProfile(): Promise<Customer> {
    const res = await requestApi<ApiResponse<Customer>>('/customer/profile');
    return res.data;
  },

  /**
   * Updates personal profile information (Full Name and Egyptian Mobile)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<Customer> {
    const res = await requestApi<ApiResponse<Customer>>('/customer/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        phoneNumber: payload.phoneNumber ? payload.phoneNumber.trim() : null,
      }),
    });
    return res.data;
  },

  /**
   * Upserts delivery address (1:1 with customer in V1)
   */
  async saveAddress(payload: CustomerAddress): Promise<CustomerAddress> {
    const res = await requestApi<ApiResponse<CustomerAddress>>('/customer/address', {
      method: 'PUT',
      body: JSON.stringify({
        governorate: payload.governorate.trim(),
        cityArea: payload.cityArea.trim(),
        detailedAddress: payload.detailedAddress.trim(),
      }),
    });
    return res.data;
  },

  /**
   * Deletes the saved delivery address for the authenticated customer
   */
  async deleteAddress(): Promise<{ success: boolean; message: string }> {
    const res = await requestApi<ApiResponse<void>>('/customer/address', {
      method: 'DELETE',
    });
    return {
      success: res.success,
      message: res.message || 'تم حذف عنوان الشحن بنجاح',
    };
  },
};
