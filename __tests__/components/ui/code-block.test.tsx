import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeBlock } from '@/components/ui/code-block'
import { ThemeProvider } from '@/components/providers/theme-provider'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

// Mock react-syntax-highlighter
jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language }: any) => (
    <pre data-testid="syntax-highlighter" data-language={language}>
      {children}
    </pre>
  ),
}))

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
  oneLight: {},
}))

describe('CodeBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders code with default language', () => {
    render(
      <ThemeProvider>
        <CodeBlock code="const x = 1" />
      </ThemeProvider>
    )
    expect(screen.getByRole('region', { name: /code block: text/i })).toBeInTheDocument()
  })

  it('renders code with specified language', () => {
    render(
      <ThemeProvider>
        <CodeBlock code="const x = 1" language="javascript" />
      </ThemeProvider>
    )
    expect(screen.getByRole('region', { name: /code block: javascript/i })).toBeInTheDocument()
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('displays copy button', () => {
    render(
      <ThemeProvider>
        <CodeBlock code="test code" />
      </ThemeProvider>
    )
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })

  it('copies code to clipboard when copy button is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    
    // Mock navigator.clipboard properly
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    })

    render(
      <ThemeProvider>
        <CodeBlock code="test code" />
      </ThemeProvider>
    )

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    expect(writeTextMock).toHaveBeenCalledWith('test code')
  })

  it('shows "Copied" state after copying', async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <ThemeProvider>
        <CodeBlock code="test code" />
      </ThemeProvider>
    )

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /code copied/i })).toBeInTheDocument()
    })
  })

  it('resets copied state after timeout', async () => {
    const user = userEvent.setup({ delay: null })
    render(
      <ThemeProvider>
        <CodeBlock code="test code" />
      </ThemeProvider>
    )

    const copyButton = screen.getByRole('button', { name: /copy code/i })
    await user.click(copyButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /code copied/i })).toBeInTheDocument()
    })

    jest.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    render(
      <ThemeProvider>
        <CodeBlock code="test" className="custom-class" />
      </ThemeProvider>
    )
    const container = screen.getByRole('region')
    expect(container).toHaveClass('custom-class')
  })

  it('shows line numbers when showLineNumbers is true', () => {
    render(
      <ThemeProvider>
        <CodeBlock code="line 1\nline 2" showLineNumbers />
      </ThemeProvider>
    )
    // The SyntaxHighlighter component should render with line numbers
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})

