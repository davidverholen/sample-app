import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast, ToastContainer } from '@/components/ui/toast'

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders toast with title', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Test Title" onClose={onClose} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders toast with description', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Title" description="Description" onClose={onClose} />)
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders success variant', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Success" variant="success" onClose={onClose} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-green-50')
  })

  it('renders error variant', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Error" variant="error" onClose={onClose} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-red-50')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  it('renders info variant', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Info" variant="info" onClose={onClose} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-blue-50')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  it('renders warning variant', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Warning" variant="warning" onClose={onClose} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-yellow-50')
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    const onClose = jest.fn()
    render(<Toast id="1" title="Test" onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close notification/i }))
    expect(onClose).toHaveBeenCalledWith('1')
  })

  it('auto-closes after duration', async () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Test" duration={1000} onClose={onClose} />)

    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('1')
    })
  })

  it('does not auto-close when duration is 0', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Test" duration={0} onClose={onClose} />)

    jest.advanceTimersByTime(10000)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    const onClose = jest.fn()
    render(<Toast id="1" title="Test" onClose={onClose} />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveAttribute('aria-live')
  })
})

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={jest.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all toasts', () => {
    const toasts = [
      { id: '1', title: 'Toast 1', onClose: jest.fn() },
      { id: '2', title: 'Toast 2', onClose: jest.fn() },
    ]
    render(<ToastContainer toasts={toasts} onClose={jest.fn()} />)
    expect(screen.getByText('Toast 1')).toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    const toasts = [{ id: '1', title: 'Test', onClose: jest.fn() }]
    render(<ToastContainer toasts={toasts} onClose={jest.fn()} />)
    const container = screen.getByLabelText('Notifications')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})
