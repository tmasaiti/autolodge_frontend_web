import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store/store'
import App from './App'

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Check if the header is rendered (use getAllByText since AutoLodge appears multiple times)
    expect(screen.getAllByText('AutoLodge')).toHaveLength(3) // Header, Footer brand, and Footer copyright
  })

  it('displays the home page by default', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Check if home page content is displayed
    expect(screen.getByText(/Rent Vehicles Across/i)).toBeInTheDocument()
  })
})