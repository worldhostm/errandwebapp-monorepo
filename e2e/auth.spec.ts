import { test, expect, handleGeolocationPrompt, loginAsTestUser } from './fixtures';

/**
 * Authentication Tests
 * 회원가입, 로그인, 로그아웃 기능 테스트
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 로드 전 위치 권한 설정
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });

    // 홈 페이지로 이동
    await page.goto('/');

    // 위치 권한 모달 자동 처리
    await handleGeolocationPrompt(page);

    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
  });

  test('AUTH-01: 랜딩 페이지 표시', async ({ page }) => {
    // 비로그인 상태에서 랜딩 페이지가 표시되는지 확인
    // 로고 링크 (헤더의 첫 번째 "부름이")
    await expect(page.getByRole('link', { name: '부름이' })).toBeVisible();
    // 로그인 버튼
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('AUTH-02: 로그인 모달 열기', async ({ page }) => {
    // 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click();

    // 로그인 모달이 열리는지 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('AUTH-03: 회원가입 탭 전환', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).click();

    // 회원가입 버튼 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // Step 1: 이름 필드 확인 및 입력
    const nameInput = page.locator('input[placeholder*="이름"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('테스트사용자');

    // Step 2: 다음 버튼 클릭하여 이메일 단계로 이동
    const nextButton = page.locator('button:not([aria-label])').filter({ hasText: '다음' }).first();
    await nextButton.click();

    const emailInput = page.locator('input[placeholder*="example@email.com"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test@example.com');

    // Step 3: 다음 버튼 클릭하여 비밀번호 단계로 이동
    await nextButton.click();

    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible({ timeout: 5000 });

    // 비밀번호와 비밀번호 확인에 123123 입력
    const allPasswordFields = await page.locator('input[type="password"]').all();
    await allPasswordFields[0].fill('123123');
    await allPasswordFields[1].fill('123123');
  });

  test('AUTH-04: 빈 필드로 로그인 시도 (클라이언트 검증)', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 빈 상태로 로그인 시도 (모달 내의 로그인 버튼)
    const loginButtons = page.getByRole('button', { name: '로그인' });
    await loginButtons.last().click();

    // HTML5 validation이 작동하는지 확인
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });

    expect(isInvalid).toBeTruthy();
  });

  test('AUTH-05: 테스트 로그인 페이지 접근', async ({ page }) => {
    // 테스트 로그인 버튼 클릭
    await page.getByRole('link', { name: '테스트 로그인' }).click();

    // URL 확인
    await expect(page).toHaveURL('/test');
  });

  test('AUTH-06: 정상 로그인 플로우 (실제 API)', async ({ page }) => {
    // 이 테스트는 실제 백엔드가 실행 중이고 테스트 계정이 있어야 합니다
    test.skip(!process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
      'TEST_EMAIL and TEST_PASSWORD environment variables required');

    await page.getByRole('button', { name: '로그인' }).first().click();

    // 로그인 정보 입력
    await page.fill('input[type="email"]', process.env.TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);

    // 로그인 버튼 클릭 (모달 내의 로그인 버튼)
    const loginButtons = page.getByRole('button', { name: '로그인' });
    await loginButtons.last().click();

    // 로그인 성공 확인 - 헤더에 사용자 이름이 표시되는지 확인
    await expect(page.getByText(/.*님/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  });

  test('AUTH-07: 로그아웃', async ({ page }) => {
    // 먼저 테스트 페이지로 이동하여 테스트 사용자로 로그인
    await page.goto('/test');

    // 테스트 사용자 버튼이 있는지 확인하고 클릭
    const testUserButton = page.getByRole('button', { name: '테스트 사용자' }).first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
    }

    // 메인 페이지로 이동
    await page.goto('/');

    // 로그인 상태 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 5000 });

    // 로그아웃 클릭
    await page.getByRole('button', { name: '로그아웃' }).click();

    // 로그아웃 확인 - 로그인 버튼이 다시 나타나는지 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });
});
