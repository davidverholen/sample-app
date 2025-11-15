import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordInput } from '@/components/ui/password-input'

describe('PasswordInput', () => {
  it('renders a password input', () => {
    render(<PasswordInput />)
    const input = document.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('toggles password visibility when button is clicked', async () => {
    const user = userEvent.setup()
    render(<PasswordInput />)
    
    const input = document.querySelector('input') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    expect(input).toHaveAttribute('type', 'password')
    
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
  })

  it('shows eye icon when password is hidden', () => {
    render(<PasswordInput />)
    const button = screen.getByRole('button', { name: /show password/i })
    expect(button).toBeInTheDocument()
  })

  it('shows eye-off icon when password is visible', async () => {
    const user = userEvent.setup()
    render(<PasswordInput />)
    
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    await user.click(toggleButton)
    
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<PasswordInput ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('passes through Input props', () => {
    render(<PasswordInput placeholder="Enter password" />)
    const input = screen.getByPlaceholderText('Enter password')
    expect(input).toBeInTheDocument()
  })

  it('handles error state', () => {
    render(<PasswordInput error="Password is required" />)
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })
})

