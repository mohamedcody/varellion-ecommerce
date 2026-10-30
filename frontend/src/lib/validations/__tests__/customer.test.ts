import { describe, it, expect } from 'vitest';
import { validateProfile, validateAddress } from '../customer';

describe('Customer Profile Validation', () => {
  it('validates Egyptian mobile numbers correctly', () => {
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '01012345678' })).toEqual({});
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '12345' }).phoneNumber).toBeDefined();
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '01412345678' }).phoneNumber).toBeDefined();
    expect(validateProfile({ fullName: 'أحمد علي', phoneNumber: '' })).toEqual({});
  });

  it('enforces full name length constraints (3-150 chars)', () => {
    expect(validateProfile({ fullName: 'أ' }).fullName).toBeDefined();
    expect(validateProfile({ fullName: 'محمد أحمد علي' }).fullName).toBeUndefined();
  });
});

describe('Customer Address Validation', () => {
  it('validates required address fields', () => {
    const valid = {
      governorate: 'Alexandria',
      cityArea: 'Smouha',
      detailedAddress: 'Building 12, Victor Emanuel St',
    };
    expect(validateAddress(valid)).toEqual({});

    const invalid = {
      governorate: '',
      cityArea: '',
      detailedAddress: '123', // < 5 chars
    };
    const errors = validateAddress(invalid);
    expect(errors.governorate).toBeDefined();
    expect(errors.cityArea).toBeDefined();
    expect(errors.detailedAddress).toBeDefined();
  });
});
