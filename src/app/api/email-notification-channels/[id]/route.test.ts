// Basic structure for API route tests for [id] endpoints
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PUT, DELETE } from './route'; // Import route handlers
import { useDrizzle, takeUniqueOrThrow } from '@/db';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { OK, NO_CONTENT, NOT_FOUND, BAD_REQUEST, CONFLICT } from 'stoker/http-status-codes';

// Mock dependencies
vi.mock('@/db', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@/db');
  return {
    ...actual,
    useDrizzle: vi.fn(),
    takeUniqueOrThrow: vi.fn(items => {
        if (!items || items.length === 0) throw new Error("No items found or an empty array was passed.");
        return items[0];
      }),
  };
});

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

describe('API: /api/email-notification-channels/[id]', () => {
  let app: Hono;
  let mockDb: any;

  beforeEach(() => {
    app = new Hono();
    // Note: Hono's testClient requires path to match exactly what's defined in app.
    // For dynamic paths like /api/email-notification-channels/:id, ensure the test client call matches.
    // The handlers themselves don't need the full path, but the app instance for testing does.
    app.put('/api/email-notification-channels/:id', PUT.fetch);
    app.delete('/api/email-notification-channels/:id', DELETE.fetch);


    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockReturnThis(),
    };
    (useDrizzle as vi.Mock).mockReturnValue(mockDb);
    (getCloudflareContext as vi.Mock).mockReturnValue({ env: { DB: {} } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testChannelId = 'enc_existing_123';
  const nonExistentChannelId = 'enc_non_existent_456';
  const existingChannel = { id: testChannelId, name: 'Original Channel', emailAddress: 'original@example.com', createdAt: new Date(), updatedAt: new Date() };

  describe('PUT /api/email-notification-channels/[id]', () => {
    const updatePayload = { name: 'Updated Channel Name' };
    const updatedChannelResponse = { ...existingChannel, ...updatePayload, updatedAt: new Date() };

    it('should update an existing email notification channel successfully (200)', async () => {
      // Mock select for checking if channel exists (it does)
      mockDb.limit.mockResolvedValueOnce([existingChannel]);
      // Mock select for checking email conflict (no conflict)
      mockDb.limit.mockResolvedValueOnce([]); 
      // Mock update().set().where().returning()
      const mockUpdateReturning = vi.fn().mockResolvedValue([updatedChannelResponse]);
      const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockDb.update.mockReturnValue({ set: mockUpdateSet });
      
      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${testChannelId}`].$put({ json: updatePayload });
      
      expect(response.status).toBe(OK);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject({ name: updatePayload.name });
      expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ ...updatePayload, updatedAt: expect.any(Date) }));
      expect(mockUpdateWhere).toHaveBeenCalledWith(expect.anything()); // Simplified check for where clause
    });

    it('should return 404 if the channel to update does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // Simulate channel not found for initial check

      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${nonExistentChannelId}`].$put({ json: updatePayload });
      expect(response.status).toBe(NOT_FOUND);
    });

    it('should return 400 for invalid update payload (e.g., empty name)', async () => {
      const client = testClient(app);
      // The Zod schema for update makes fields optional, but if name is provided, it must be non-empty.
      // emailNotificationChannelUpdateSchema (imported in route.ts) defines name.min(1).optional()
      const response = await client.api['email-notification-channels'][`:${testChannelId}`].$put({ json: { name: '' } });
      expect(response.status).toBe(BAD_REQUEST);
    });
    
    it('should return 400 for invalid email format in update payload', async () => {
      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${testChannelId}`].$put({ json: { emailAddress: 'invalid-email' } });
      expect(response.status).toBe(BAD_REQUEST);
    });

    it('should return 409 if attempting to update email to one that already exists for another channel', async () => {
      const newEmail = 'taken@example.com';
      mockDb.limit.mockResolvedValueOnce([existingChannel]); // First check: channel exists
      mockDb.limit.mockResolvedValueOnce([{ id: 'enc_other_789', name: 'Other Channel', emailAddress: newEmail }]); // Second check: new email is taken

      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${testChannelId}`].$put({ json: { emailAddress: newEmail } });
      expect(response.status).toBe(CONFLICT);
    });
  });

  describe('DELETE /api/email-notification-channels/[id]', () => {
    it('should delete an existing email notification channel successfully (204)', async () => {
      // Mock select for checking if channel exists (it does)
      mockDb.limit.mockResolvedValueOnce([{ id: testChannelId }]); 
      // Mock delete().where()
      const mockDeleteWhere = vi.fn().mockResolvedValue({ rowCount: 1 }); // Simulate successful delete
      mockDb.delete.mockReturnValue({ where: mockDeleteWhere });

      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${testChannelId}`].$delete();
      expect(response.status).toBe(NO_CONTENT);
      expect(mockDeleteWhere).toHaveBeenCalledWith(expect.anything()); // Simplified check for where clause
    });

    it('should return 404 if the channel to delete does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // Simulate channel not found

      const client = testClient(app);
      const response = await client.api['email-notification-channels'][`:${nonExistentChannelId}`].$delete();
      expect(response.status).toBe(NOT_FOUND);
    });
  });
});
