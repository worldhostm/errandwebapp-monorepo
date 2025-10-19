import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * 회원가입, 로그인, 로그아웃 기능 테스트
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('AUTH-01: 랜딩 페이지 표시', async ({ page }) => {
    // 비로그인 상태에서 랜딩 페이지가 표시되는지 확인
    await expect(page.locator('text=부름이')).toBeVisible();
    await expect(page.locator('text=로그인')).toBeVisible();
  });

  test('AUTH-02: 로그인 모달 열기', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 로그인 모달이 열리는지 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('AUTH-03: 회원가입 탭 전환', async ({ page }) => {
    // 로그인 모달 열기
    await page.click('button:has-text("로그인")');

    // 회원가입 탭 클릭
    await page.click('text=회원가입');

    // 회원가입 필드 확인
    await expect(page.locator('input[placeholder*="이름"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('AUTH-04: 빈 필드로 로그인 시도 (클라이언트 검증)', async ({ page }) => {
    // 로그인 모달 열기
    await page.click('button:has-text("로그인")');

    // 빈 상태로 로그인 시도
    await page.click('button:has-text("로그인")');

    // HTML5 validation이 작동하는지 확인
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });

    expect(isInvalid).toBeTruthy();
  });

  test('AUTH-05: 테스트 로그인 페이지 접근', async ({ page }) => {
    // 테스트 로그인 버튼 클릭
    await page.click('a:has-text("테스트 로그인")');

    // URL 확인
    await expect(page).toHaveURL('/test');
  });

  test('AUTH-06: 정상 로그인 플로우 (실제 API)', async ({ page }) => {
    // 이 테스트는 실제 백엔드가 실행 중이고 테스트 계정이 있어야 합니다
    test.skip(!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
      'TEST_EMAIL and TEST_PASSWORD environment variables required');

    await page.click('button:has-text("로그인")');

    // 로그인 정보 입력
    await page.fill('input[type="email"]', process.env.TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);

    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 로그인 성공 확인 - 헤더에 사용자 이름이 표시되는지 확인
    await expect(page.locator('text=/.*님/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=로그아웃')).toBeVisible();
  });

  test('AUTH-07: 로그아웃', async ({ page }) => {
    // 먼저 테스트 페이지로 이동하여 테스트 사용자로 로그인
    await page.goto('/test');

    // 테스트 사용자 버튼이 있는지 확인하고 클릭
    const testUserButton = page.locator('button:has-text("테스트 사용자")').first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
    }

    // 메인 페이지로 이동
    await page.goto('/');

    // 로그인 상태 확인
    await expect(page.locator('text=로그아웃')).toBeVisible({ timeout: 5000 });

    // 로그아웃 클릭
    await page.click('text=로그아웃');

    // 로그아웃 확인 - 로그인 버튼이 다시 나타나는지 확인
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
  });
});
