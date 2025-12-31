import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => null,
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {},
  clear: () => {},
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  
  constructor() {}
  
  observe() {
    return null
  }
  
  disconnect() {
    return null
  }
  
  unobserve() {
    return null
  }
  
  takeRecords() {
    return []
  }
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: {
          latitude: -17.8292,
          longitude: 31.0522
        }
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  }
});

// Mock fetch for tests that don't use MSW
global.fetch = vi.fn();

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
}

const mockIDBDatabase = {
  objectStoreNames: {
    contains: () => false,
  },
  createObjectStore: () => ({
    createIndex: () => {},
  }),
  transaction: () => ({
    objectStore: () => ({
      add: () => mockIDBRequest,
      put: () => mockIDBRequest,
      get: () => mockIDBRequest,
      getAll: () => mockIDBRequest,
      delete: () => mockIDBRequest,
    }),
  }),
}

global.indexedDB = {
  open: () => {
    const request = { ...mockIDBRequest, result: mockIDBDatabase }
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: request } as any)
    }, 0)
    return request as any
  },
  deleteDatabase: () => mockIDBRequest,
} as any

// Mock URL.createObjectURL for file uploads
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

  readAsDataURL(file: Blob) {
    this.result = 'data:text/plain;base64,dGVzdA==';
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    }, 0);
  }

  readAsText(file: Blob) {
    this.result = 'test content';
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: this } as any);
      }
    }, 0);
  }

  abort() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
} as any;