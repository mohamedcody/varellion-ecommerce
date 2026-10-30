import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '../page';
import { customerService } from '@/services/customer';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { username: 'ahmed', email: 'ahmed@varellion.com', role: 'USER' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders customer name and address after loading', async () => {
    vi.spyOn(customerService, 'getProfile').mockResolvedValue({
      userId: 'uuid-123',
      fullName: 'أحمد علي',
      phoneNumber: '01012345678',
      email: 'ahmed@varellion.com',
      isActive: true,
      address: {
        governorate: 'Cairo',
        cityArea: 'Nasr City',
        detailedAddress: '10 Abbas El Akkad St',
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('الملف الشخصي')).toBeDefined();
      expect(screen.getByDisplayValue('أحمد علي')).toBeDefined();
      expect(screen.getByDisplayValue('01012345678')).toBeDefined();
      expect(screen.getByText('10 Abbas El Akkad St')).toBeDefined();
    });
  });

  it('submits updated profile when user clicks save', async () => {
    vi.spyOn(customerService, 'getProfile').mockResolvedValue({
      userId: 'uuid-123',
      fullName: 'أحمد علي',
      phoneNumber: '01012345678',
      isActive: true,
    });

    const updateSpy = vi.spyOn(customerService, 'updateProfile').mockResolvedValue({
      userId: 'uuid-123',
      fullName: 'أحمد علي المعدل',
      phoneNumber: '01123456789',
      isActive: true,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('أحمد علي')).toBeDefined();
    });

    const nameInput = screen.getByDisplayValue('أحمد علي');
    fireEvent.change(nameInput, { target: { value: 'أحمد علي المعدل' } });

    const saveButton = screen.getByRole('button', { name: /حفظ التعديلات/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'أحمد علي المعدل',
        })
      );
    });
  });
});
