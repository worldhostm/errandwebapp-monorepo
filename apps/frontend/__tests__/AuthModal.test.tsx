import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../app/components/AuthModal';

// Mock functions
const mockOnClose = jest.fn();
const mockOnLogin = jest.fn();
const mockOnRegister = jest.fn();

describe('AuthModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form by default', () => {
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이메일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('should switch to register form when register tab is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    await user.click(screen.getByText('회원가입'));

    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByText('단계 1 / 4')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이름을 입력해주세요')).toBeInTheDocument();
    expect(screen.getByText('다음')).toBeInTheDocument();
  });

  it('should call onLogin when login form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '123456');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('should go through register steps when all fields are filled', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    // Switch to register tab
    await user.click(screen.getByText('회원가입'));

    // Step 1: Fill name and go to next step
    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '테스트사용자');
    await user.click(screen.getByText('다음'));

    // Verify we moved to step 2
    await waitFor(() => {
      expect(screen.getByText('단계 2 / 4')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    await user.click(screen.getByText('✕'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AuthModal
        isOpen={false}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'invalid-email');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), '123456');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    // HTML5 validation should prevent form submission
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should require all fields in register form', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthModal
        isOpen={true}
        onClose={mockOnClose}
        onLogin={mockOnLogin}
        onRegister={mockOnRegister}
      />
    );

    // Switch to register tab
    await user.click(screen.getByText('회원가입'));

    // Try to proceed without filling the first step (name)
    const nextButton = screen.getByText('다음');
    expect(nextButton).toBeDisabled();

    // Should not call onRegister due to required field validation
    expect(mockOnRegister).not.toHaveBeenCalled();
  });
});