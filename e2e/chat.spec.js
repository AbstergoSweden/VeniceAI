import { test, expect } from '@playwright/test';

test.describe('Chat Panel Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the chat panel', async ({ page }) => {
    // Check that the chat panel is present
    const chatPanel = page.locator('.m3-surface').first(); // First surface element should be chat panel
    await expect(chatPanel).toBeVisible();

    // Check that the system prompt textarea is visible
    await expect(page.locator('label:has-text("System Prompt")')).toBeVisible();
  });

  test('should allow entering a system prompt', async ({ page }) => {
    const testSystemPrompt = 'You are a helpful assistant that creates detailed image descriptions.';

    // Find the system prompt textarea
    const systemPromptTextarea = page.locator('textarea').first(); // First textarea should be system prompt
    await systemPromptTextarea.fill(testSystemPrompt);

    // Verify the text was entered
    await expect(systemPromptTextarea).toHaveValue(testSystemPrompt);
  });

  test('should allow sending a message in the chat', async ({ page }) => {
    // Fill in a message in the chat input
    const messageInput = page.locator('textarea[placeholder="Type a message..."]');
    const testMessage = 'Hello, can you help me create a prompt for a landscape?';
    
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');

    // Check that the message appears in the chat history
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
  });

  test('should display chat messages', async ({ page }) => {
    // Send a test message
    const messageInput = page.locator('textarea[placeholder="Type a message..."]');
    await messageInput.fill('Test message');
    await messageInput.press('Enter');

    // Check that both user and assistant messages are displayed
    await expect(page.locator('.max-w-[70%]')).toHaveCount(2); // User + Assistant message
  });
});