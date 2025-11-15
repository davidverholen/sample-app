import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Title" description="Description text" />)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const icon = <span data-testid="test-icon">Icon</span>
    render(<EmptyState title="Title" icon={icon} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const action = {
      label: 'Create Item',
      onClick: jest.fn(),
    }
    render(<EmptyState title="Title" action={action} />)
    expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    const action = {
      label: 'Create Item',
      onClick: handleClick,
    }
    render(<EmptyState title="Title" action={action} />)

    await user.click(screen.getByRole('button', { name: 'Create Item' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(<EmptyState title="No items" />)
    const container = screen.getByRole('status')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })

  it('hides icon from screen readers', () => {
    const icon = <span>Icon</span>
    render(<EmptyState title="Title" icon={icon} />)
    const iconContainer = screen.getByText('Icon').closest('[aria-hidden="true"]')
    expect(iconContainer).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<EmptyState title="Title" className="custom-class" />)
    const container = screen.getByRole('status')
    expect(container).toHaveClass('custom-class')
  })
})

