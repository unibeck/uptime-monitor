import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendNotificationEmail } from './email-sender'; // Adjust path as necessary
import { EmailMessage } from 'cloudflare:email'; // Mock this or ensure it's available

// Mock the mimetext library
vi.mock('mimetext', () => {
  const actualMimeText = vi.importActual('mimetext');
  const mockCreateMimeMessage = () => {
    const actualMsg = actualMimeText.createMimeMessage();
    return {
      ...actualMsg, // Spread actual implementation details if needed by the test
      setSender: vi.fn(),
      setRecipient: vi.fn(),
      setSubject: vi.fn(),
      addMessage: vi.fn(),
      asRaw: vi.fn(() => 'mocked raw email content'), // Mock raw content generation
    };
  };
  return {
    ...actualMimeText,
    createMimeMessage: mockCreateMimeMessage,
  };
});


// Mock Cloudflare's EmailMessage if its constructor or methods are complex
// For now, we assume it's a simple constructor and doesn't need deep mocking for these tests.
// If EmailMessage itself had complex logic or side effects, it would be mocked similarly.
// Mock EmailMessage to check constructor arguments, as the instance itself might be opaque
const mockEmailMessageInstance = { from: '', to: '', content: ''};
vi.mock('cloudflare:email', () => ({
  EmailMessage: vi.fn().mockImplementation((from, to, raw) => {
    mockEmailMessageInstance.from = from;
    mockEmailMessageInstance.to = to;
    mockEmailMessageInstance.content = raw;
    return mockEmailMessageInstance; // Return the mock instance for any further checks if needed
  }),
}));

describe('Email Sender Service: sendNotificationEmail', () => {
  let mockEnv: any;
  // Get the mocked version of createMimeMessage
  const { createMimeMessage } = await vi.importActual('mimetext') as { createMimeMessage: any };
  // We need to get the mocked instance that was created inside sendNotificationEmail
  // This requires a bit of a workaround or ensuring the mock setup allows capturing it.
  // The current mimetext mock in the file already makes createMimeMessage return a new mockable instance each time.
  let mockMimeMsg: any; // To store the instance used by the function

  beforeEach(() => {
    vi.clearAllMocks(); // Clears all mocks, including the call counts on vi.fn()
    
    // Re-mock createMimeMessage for each test to get a fresh mock instance
    // and to capture the specific instance used by the function under test.
    const actualMimeTextModule = await vi.importActual('mimetext') as { createMimeMessage: any, MimeMessage: any };
    mockMimeMsg = { // This is the mock instance we'll check
        setSender: vi.fn(),
        setRecipient: vi.fn(),
        setSubject: vi.fn(),
        addMessage: vi.fn(),
        asRaw: vi.fn(() => 'mocked raw email content'),
        // include other methods if they are called and need specific mock behavior
    };
    // Override the mock for mimetext specifically for createMimeMessage
    vi.mocked(actualMimeTextModule.createMimeMessage).mockReturnValue(mockMimeMsg);


    mockEnv = {
      EMAIL_SEND_BINDING: {
        send: vi.fn().mockResolvedValue(undefined),
      },
    };
    // Reset the global mockEmailMessageInstance for each test
    mockEmailMessageInstance.from = '';
    mockEmailMessageInstance.to = '';
    mockEmailMessageInstance.content = '';
    vi.mocked(EmailMessage).mockClear(); // Clear calls to EmailMessage constructor
  });

  const emailParams = {
    to: 'recipient@example.com',
    subject: 'Test Subject',
    htmlBody: '<p>Hello HTML</p>',
    textBody: 'Hello Text',
  };

  it('should correctly construct and send an email message', async () => {
    await sendNotificationEmail({ ...emailParams, env: mockEnv });

    // Verify MimeMessage setup on the captured instance
    expect(mockMimeMsg.setSender).toHaveBeenCalledWith({
      name: 'SolStatus Notifications',
      addr: 'noreply@yourdomain.com', 
    });
    expect(mockMimeMsg.setRecipient).toHaveBeenCalledWith(emailParams.to);
    expect(mockMimeMsg.setSubject).toHaveBeenCalledWith(emailParams.subject);
    expect(mockMimeMsg.addMessage).toHaveBeenCalledWith({
      contentType: 'text/plain',
      data: emailParams.textBody,
    });
    expect(mockMimeMsg.addMessage).toHaveBeenCalledWith({
      contentType: 'text/html',
      data: emailParams.htmlBody,
    });
    expect(mockMimeMsg.asRaw).toHaveBeenCalled();

    // Verify EmailMessage construction (via the global mockEmailMessageInstance)
    expect(EmailMessage).toHaveBeenCalledTimes(1);
    expect(mockEmailMessageInstance.from).toBe('noreply@yourdomain.com');
    expect(mockEmailMessageInstance.to).toBe(emailParams.to);
    expect(mockEmailMessageInstance.content).toBe('mocked raw email content');

    // Verify EMAIL_SEND_BINDING.send call
    expect(mockEnv.EMAIL_SEND_BINDING.send).toHaveBeenCalledTimes(1);
    expect(mockEnv.EMAIL_SEND_BINDING.send).toHaveBeenCalledWith(mockEmailMessageInstance);
  });

  it('should throw an error if EMAIL_SEND_BINDING is not configured', async () => {
    const envWithoutBinding = { ...mockEnv, EMAIL_SEND_BINDING: undefined };
    await expect(
      sendNotificationEmail({ ...emailParams, env: envWithoutBinding })
    ).rejects.toThrow('Email sending service is not configured.');
  });

  it('should correctly handle errors from EMAIL_SEND_BINDING.send()', async () => {
    const sendError = new Error('Cloudflare send failed');
    mockEnv.EMAIL_SEND_BINDING.send.mockRejectedValue(sendError);

    await expect(
      sendNotificationEmail({ ...emailParams, env: mockEnv })
    ).rejects.toThrow(`Email sending failed: ${sendError.message}`);
  });

  it('should throw a generic error if EMAIL_SEND_BINDING.send() fails with a non-Error object', async () => {
    mockEnv.EMAIL_SEND_BINDING.send.mockRejectedValue('some string error');
    await expect(
      sendNotificationEmail({ ...emailParams, env: mockEnv })
    ).rejects.toThrow('Email sending failed due to an unknown error.');
  });
});
