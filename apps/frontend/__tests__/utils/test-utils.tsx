import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock user object for testing
export const mockUser = {
  id: 'test-user-id',
  name: '테스트사용자',
  email: 'test@example.com',
  avatar: undefined,
  phone: undefined,
  location: undefined,
  rating: 5,
  totalErrands: 0,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock errand object for testing
export const mockErrand = {
  id: 'test-errand-id',
  title: '테스트 심부름',
  description: '테스트용 심부름입니다',
  lat: 37.1946,
  lng: 127.1013,
  reward: 10000,
  status: 'pending' as const,
  category: '배달',
  deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  distance: 1.5,
  requestedBy: {
    id: 'requester-id',
    name: '요청자',
    email: 'requester@example.com',
  },
};

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Helper function to create mock API responses
export const createMockApiResponse = <T>(data: T, success = true, error?: string) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : error,
});

// Helper function to wait for element to appear
export const waitForElement = async (getByTestId: any, testId: string, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      try {
        const element = getByTestId(testId);
        resolve(element);
      } catch (error) {
        if (Date.now() - start >= timeout) {
          reject(new Error(`Element with testId "${testId}" not found within ${timeout}ms`));
        } else {
          setTimeout(check, 50);
        }
      }
    };
    check();
  });
};

// Basic test to satisfy Jest requirement
describe('Test Utils', () => {
  it('should export mock objects', () => {
    expect(mockUser).toBeDefined();
    expect(mockErrand).toBeDefined();
    expect(createMockApiResponse).toBeDefined();
  });
});