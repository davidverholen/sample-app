import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders with a label when provided', () => {
    render(
      <div>
        <label htmlFor="test-input">Test Label</label>
        <Input id="test-input" />
      </div>
    )
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByText('This field is required')).toHaveAttribute('role', 'alert')
  })

  it('displays help text when helpText prop is provided', () => {
    render(<Input helpText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('does not display help text when error is present', () => {
    render(<Input error="Error message" helpText="Help text" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Help text')).not.toBeInTheDocument()
  })

  it('applies error styles when error is present', () => {
    render(<Input error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-destructive')
  })

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('sets aria-describedby with error ID when error is present', () => {
    render(<Input id="test" error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'test-error')
  })

  it('sets aria-describedby with help text ID when helpText is present', () => {
    render(<Input id="test" helpText="Help" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'test-help')
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<Input />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'test@example.com')
    expect(input).toHaveValue('test@example.com')
  })

  it('supports different input types', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('generates unique ID when id is not provided', () => {
    render(
      <>
        <Input />
        <Input />
      </>
    )
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveAttribute('id')
    expect(inputs[1]).toHaveAttribute('id')
    expect(inputs[0].id).not.toBe(inputs[1].id)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('passes through other HTML attributes', () => {
    render(<Input placeholder="Enter text" data-testid="test-input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('placeholder', 'Enter text')
  })
})

