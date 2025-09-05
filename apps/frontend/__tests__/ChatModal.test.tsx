import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatModal from '../app/components/ChatModal';
import { chatApi } from '../app/lib/api';

// Mock the API
jest.mock('../app/lib/api', () => ({
  chatApi: {
    getChatByErrand: jest.fn(),
    sendMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  },
}));

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  errandTitle: '테스트 심부름',
  errandId: 'test-errand-id',
  currentUserId: 'current-user-id',
};

const mockChatResponse = {
  success: true,
  data: {
    chat: {
      _id: 'chat-id',
      participants: [
        {
          _id: 'current-user-id',
          name: '현재사용자',
          email: 'current@example.com',
        },
        {
          _id: 'other-user-id',
          name: '상대방사용자',
          email: 'other@example.com',
        },
      ],
      messages: [
        {
          _id: 'message-1',
          content: '안녕하세요!',
          senderId: 'other-user-id',
          sender: {
            _id: 'other-user-id',
            name: '상대방사용자',
            email: 'other@example.com',
          },
          createdAt: '2023-01-01T00:00:00.000Z',
          isRead: true,
        },
      ],
    },
  },
};

describe('ChatModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedChatApi.getChatByErrand.mockResolvedValue(mockChatResponse as any);
  });

  it('should render loading state initially', async () => {
    render(<ChatModal {...mockProps} />);

    expect(screen.getByText('채팅을 불러오는 중...')).toBeInTheDocument();
  });

  it('should load and display chat messages', async () => {
    render(<ChatModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('안녕하세요!')).toBeInTheDocument();
    });

    expect(screen.getByText('상대방사용자')).toBeInTheDocument();
    expect(mockedChatApi.getChatByErrand).toHaveBeenCalledWith('test-errand-id');
  });

  it('should display error message when API fails', async () => {
    mockedChatApi.getChatByErrand.mockResolvedValue({
      success: false,
      error: '채팅을 불러올 수 없습니다.',
    } as any);

    render(<ChatModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('채팅을 불러올 수 없습니다.')).toBeInTheDocument();
    });

    expect(screen.getByText('다시 시도')).toBeInTheDocument();
  });

  it('should send message when form is submitted', async () => {
    const user = userEvent.setup();
    const sendMessageResponse = {
      success: true,
      data: {
        message: {
          _id: 'new-message-id',
          content: '새 메시지',
          senderId: 'current-user-id',
          sender: {
            _id: 'current-user-id',
            name: '현재사용자',
            email: 'current@example.com',
          },
          createdAt: '2023-01-01T01:00:00.000Z',
          isRead: false,
        },
      },
    };

    mockedChatApi.sendMessage.mockResolvedValue(sendMessageResponse as any);

    render(<ChatModal {...mockProps} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('안녕하세요!')).toBeInTheDocument();
    });

    // Type and send message
    const input = screen.getByPlaceholderText('메시지를 입력하세요...');
    await user.type(input, '새 메시지');
    await user.click(screen.getByText('전송'));

    await waitFor(() => {
      expect(screen.getByText('새 메시지')).toBeInTheDocument();
    });

    expect(mockedChatApi.sendMessage).toHaveBeenCalledWith('chat-id', '새 메시지');
  });

  it('should disable input when no chatId is available', async () => {
    mockedChatApi.getChatByErrand.mockResolvedValue({
      success: true,
      data: {
        chat: {
          ...mockChatResponse.data.chat,
          _id: undefined, // No chat ID
        },
      },
    } as any);

    render(<ChatModal {...mockProps} />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('메시지를 입력하세요...');
      expect(input).toBeDisabled();
    });
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<ChatModal {...mockProps} onClose={mockOnClose} />);

    await user.click(screen.getByText('✕'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<ChatModal {...mockProps} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show empty state when no messages', async () => {
    mockedChatApi.getChatByErrand.mockResolvedValue({
      success: true,
      data: {
        chat: {
          ...mockChatResponse.data.chat,
          messages: [],
        },
      },
    } as any);

    render(<ChatModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('채팅을 시작해보세요!')).toBeInTheDocument();
    });
  });
});