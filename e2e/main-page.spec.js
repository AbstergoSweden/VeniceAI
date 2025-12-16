import { test, expect } from '@playwright/test';

test.describe('Venice.ai Generator App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page with title and controls', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Venice\.ai Generator/);

    // Check that the main heading is present
    await expect(page.locator('h1')).toContainText('Venice.ai Generator');

    // Check that the controls section exists
    await expect(page.locator('text=Controls')).toBeVisible();

    // Check that prompt textarea is present
    await expect(page.locator('textarea[placeholder*="A futuristic cityscape"]')).toBeVisible();

    // Check that generate button is present
    await expect(page.locator('button', { hasText: 'Generate' })).toBeVisible();
  });

  test('should allow entering a prompt and see it in the textarea', async ({ page }) => {
    const testPrompt = 'A beautiful landscape with mountains and a lake at sunset';

    // Fill the prompt textarea
    await page.locator('textarea[placeholder*="A futuristic cityscape"]').fill(testPrompt);

    // Verify the text was entered
    await expect(page.locator('textarea[placeholder*="A futuristic cityscape"]')).toHaveValue(testPrompt);
  });

  test('should display gallery section', async ({ page }) => {
    // Check that gallery section exists
    await expect(page.locator('text=No images generated yet')).toBeVisible();

    // Gallery should be empty initially
    const galleryItems = page.locator('.m3-media-card');
    await expect(galleryItems).toHaveCount(0);
  });

  test('should allow selecting different models', async ({ page }) => {
    // Click on the model select dropdown
    const modelSelect = page.locator('select').first();
    await expect(modelSelect).toBeVisible();
    
    // Get all options in the dropdown
    const optionsCount = await page.locator('select option').count();
    
    // Should have multiple model options
    expect(optionsCount).toBeGreaterThan(1);
  });

  test('should allow selecting different aspect ratios', async ({ page }) => {
    // Check that aspect ratio buttons are present
    const tallButton = page.locator('button', { hasText: 'Tall' });
    const wideButton = page.locator('button', { hasText: 'Wide' });
    const squareButton = page.locator('button', { hasText: 'Square' });

    await expect(tallButton).toBeVisible();
    await expect(wideButton).toBeVisible();
    await expect(squareButton).toBeVisible();

    // Test clicking on different aspect ratios
    await tallButton.click();
    await expect(tallButton).toHaveClass(/m3-chip-selected/);

    await wideButton.click();
    await expect(wideButton).toHaveClass(/m3-chip-selected/);

    await squareButton.click();
    await expect(squareButton).toHaveClass(/m3-chip-selected/);
  });

  test('should handle negative prompt input', async ({ page }) => {
    const testNegativePrompt = 'ugly, blurry, low quality';
    
    // Find the negative prompt textarea (using label association)
    const negativePromptTextarea = page.locator('textarea').nth(1); // Second textarea
    await negativePromptTextarea.fill(testNegativePrompt);

    // Verify the text was entered
    await expect(negativePromptTextarea).toHaveValue(testNegativePrompt);
  });

  test('should handle the idea suggestion feature', async ({ page }) => {
    // Click the "Idea" button to suggest a prompt
    const ideaButton = page.locator('button', { hasText: 'Idea' });
    
    // Mock the browser prompt since Playwright doesn't handle native dialogs by default
    await page.on('dialog', dialog => {
      dialog.accept('a cyberpunk city');
    });

    await ideaButton.click();
    
    // The prompt textarea should now contain the suggested prompt
    const promptTextarea = page.locator('textarea[placeholder*="A futuristic cityscape"]');
    await expect(promptTextarea).not.toHaveValue('');
  });

  test('should toggle advanced options', async ({ page }) => {
    // Check that the hide watermark checkbox is present
    const hideWatermarkCheckbox = page.locator('text=Hide Watermark').locator('..').locator('input[type="checkbox"]');
    await expect(hideWatermarkCheckbox).toBeVisible();
    
    // Check that the blur NSFW checkbox is present
    const blurNSFWCheckbox = page.locator('text=Blur NSFW').locator('..').locator('input[type="checkbox"]');
    await expect(blurNSFWCheckbox).toBeVisible();

    // Test toggling the hide watermark option
    await expect(hideWatermarkCheckbox).not.toBeChecked();
    await hideWatermarkCheckbox.check();
    await expect(hideWatermarkCheckbox).toBeChecked();

    // Test toggling the blur NSFW option
    await expect(blurNSFWCheckbox).not.toBeChecked();
    await blurNSFWCheckbox.check();
    await expect(blurNSFWCheckbox).toBeChecked();
  });
});