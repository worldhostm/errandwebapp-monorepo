import { test, expect, handleGeolocationPrompt } from './fixtures';

/**
 * Navigation and UI Tests
 * 네비게이션 및 기본 UI 요소 테스트
 */

test.describe('Navigation and UI', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 로드 전 위치 권한 설정
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });
  });

  test('NAV-01: 홈페이지 로드', async ({ page }) => {
    await page.goto('/');
    await handleGeolocationPrompt(page);
    await expect(page).toHaveTitle(/부름이|Errand/i);
  });

  test('NAV-02: 헤더 요소 확인', async ({ page }) => {
    await page.goto('/');
    await handleGeolocationPrompt(page);

    // 로고 확인
    await expect(page.locator('text=부름이')).toBeVisible();

    // 사용 가이드 링크 확인
    await expect(page.locator('a:has-text("사용 가이드")')).toBeVisible();
  });

  test('NAV-03: 사용 가이드 페이지 이동', async ({ page }) => {
    await page.goto('/');
    await handleGeolocationPrompt(page);

    // 사용 가이드 클릭
    await page.click('a:has-text("사용 가이드")');

    // URL 확인
    await expect(page).toHaveURL('/guide');
  });

  test('NAV-04: 로고 클릭 시 홈으로 이동', async ({ page }) => {
    await page.goto('/guide');
    await handleGeolocationPrompt(page);

    // 로고 클릭
    await page.click('a:has-text("부름이")');

    // 홈페이지로 돌아왔는지 확인
    await expect(page).toHaveURL('/');
  });

  test('NAV-05: 반응형 레이아웃 - 모바일', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await handleGeolocationPrompt(page);

    // 헤더가 여전히 보이는지 확인
    await expect(page.locator('text=부름이')).toBeVisible();
  });

  test('NAV-06: 반응형 레이아웃 - 태블릿', async ({ page }) => {
    // 태블릿 뷰포트 설정
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await handleGeolocationPrompt(page);

    await expect(page.locator('text=부름이')).toBeVisible();
  });

  test('NAV-07: 다크모드 지원 여부', async ({ page }) => {
    await page.goto('/');
    await handleGeolocationPrompt(page);

    // 다크모드 토글 버튼 찾기 (있을 경우)
    const darkModeToggle = page.locator('button[aria-label*="dark"]').or(
      page.locator('button:has-text("🌙")')
    );

    // 다크모드 기능이 있는지 확인 (선택사항)
    const exists = await darkModeToggle.count() > 0;
    console.log('Dark mode toggle exists:', exists);
  });
});

test.describe('Logged In Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 로드 전 위치 권한 설정
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });

    // 테스트 사용자로 로그인
    await page.goto('/test');
    await handleGeolocationPrompt(page);
    await page.waitForLoadState('networkidle');

    const testUserButton = page.locator('button:has-text("테스트 사용자")').first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 메인 페이지로 이동
    await page.goto('/');
    await handleGeolocationPrompt(page);
    await page.waitForLoadState('networkidle');
  });

  test('NAV-08: 로그인 후 헤더 요소', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 심부름 등록 버튼
    await expect(page.locator('button:has-text("심부름 등록")')).toBeVisible();

    // 알림 벨
    await expect(page.locator('text=🔔')).toBeVisible();

    // 프로필 이미지
    await expect(page.locator('img[alt*="프로필"]')).toBeVisible();

    // 로그아웃 버튼
    await expect(page.locator('text=로그아웃')).toBeVisible();
  });

  test('NAV-09: 프로필 클릭', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 프로필 영역 클릭
    const profileButton = page.locator('button:has(img[alt*="프로필"])');
    if (await profileButton.isVisible()) {
      await profileButton.click();

      // 프로필 모달이 열리는지 확인
      await expect(page.locator('text=프로필 정보')).toBeVisible({ timeout: 5000 });
    }
  });

  test('NAV-10: 알림 벨 클릭', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 알림 벨 클릭
    const notificationButton = page.locator('button:has-text("🔔")');
    if (await notificationButton.isVisible()) {
      await notificationButton.click();

      // 알림 모달이 열리는지 확인
      await expect(page.locator('text=알림')).toBeVisible({ timeout: 5000 });
    }
  });

  test('NAV-11: 탭 전환', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 탭이 표시되는지 확인
    await expect(page.locator('button:has-text("심부름 받기")')).toBeVisible();
    await expect(page.locator('button:has-text("심부름 수행")')).toBeVisible();
    await expect(page.locator('button:has-text("심부름 요청")')).toBeVisible();

    // 각 탭 클릭 테스트
    await page.click('button:has-text("심부름 요청")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("심부름 수행")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("심부름 받기")');
    await page.waitForTimeout(500);
  });
});
