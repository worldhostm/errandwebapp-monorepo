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

  test('AUTH-03: 회원가입 전체 플로우', async ({ page }) => {
    // 로그인 버튼 클릭하여 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 회원가입 링크 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // ===== Step 1: 이름 입력 =====
    const nameInput = page.locator('input[placeholder="이름을 입력해주세요"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('테스트사용자');

    // Step 1 → Step 2로 이동 (다음 버튼 클릭)
    const nextButtons = page.locator('button').filter({ hasText: /^다음$/ });
    await nextButtons.first().click();

    // ===== Step 2: 이메일 입력 =====
    const emailInput = page.locator('input[placeholder="example@email.com"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test@example.com');

    // Step 2 → Step 3으로 이동
    await nextButtons.first().click();

    // ===== Step 3: 비밀번호 입력 =====
    const passwordFields = page.locator('input[type="password"]');
    await expect(passwordFields.first()).toBeVisible({ timeout: 5000 });

    // 비밀번호 필드 채우기 (첫 번째는 비밀번호, 두 번째는 비밀번호 확인)
    const allPasswordFields = await page.locator('input[type="password"]').all();
    await allPasswordFields[0].fill('TestPassword123');
    await allPasswordFields[1].fill('TestPassword123');

    // Step 3 → Step 4로 이동
    await nextButtons.first().click();

    // ===== Step 4: 프로필 사진 (선택사항) =====
    // 프로필 사진은 선택사항이므로 건너뛰고 가입 완료 버튼 클릭
    const registerButton = page.locator('button').filter({ hasText: /^가입 완료$/ });
    await expect(registerButton).toBeVisible({ timeout: 5000 });
    await registerButton.click();

    // 회원가입 성공 확인 - 로그인 상태로 변경되는지 확인
    // 로그인 버튼이 사라지고 로그아웃 버튼이 나타나야 함
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-03-B: 회원가입 탭 전환 (회원가입 → 로그인)', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).click();

    // 회원가입 버튼 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // Step 1에서 이름 입력
    const nameInput = page.locator('input[placeholder="이름을 입력해주세요"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('테스트사용자');

    // 로그인으로 돌아가기 위해 로그인 링크 클릭
    const toggleButton = page.getByRole('button', { name: '로그인' }).filter({ hasText: /로그인/ }).last();
    await toggleButton.click();

    // 로그인 모달로 돌아가졌는지 확인 (이메일/비밀번호 입력 필드가 보이는지)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
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

    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 로그인 폼이 보이는지 확인 (로그인 모달 Step: 이메일과 비밀번호 입력 필드)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();

    // 로그인 정보 입력
    await emailInput.fill(process.env.TEST_EMAIL!);
    await passwordInput.fill(process.env.TEST_PASSWORD!);

    // 로그인 버튼 클릭 (모달 내의 로그인 버튼)
    const loginButton = page.getByRole('button').filter({ hasText: /^로그인$/ }).last();
    await loginButton.click();

    // 로그인 성공 확인 - 헤더에서 로그아웃 버튼이 나타나는지 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 10000 });

    // 사용자 이름이 표시되는지 확인 (선택사항)
    const userDisplayNameOrLogoutBtn = page.getByRole('button', { name: '로그아웃' });
    await expect(userDisplayNameOrLogoutBtn).toBeVisible();
  });

  test('AUTH-06-B: 잘못된 자격증명으로 로그인 시도', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 로그인 정보 입력 (잘못된 정보)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    // 로그인 버튼 클릭
    const loginButton = page.getByRole('button').filter({ hasText: /^로그인$/ }).last();
    await loginButton.click();

    // 에러 메시지가 나타나는지 확인 (alert 또는 에러 메시지)
    // alert이 나타날 수 있으므로 대기
    await page.waitForTimeout(1000);

    // 로그아웃 버튼이 없어야 함 (로그인 실패 상태)
    const logoutButton = page.getByRole('button', { name: '로그아웃' });
    const isLoggedIn = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isLoggedIn).toBeFalsy();
  });

  test('AUTH-07: 로그아웃', async ({ page }) => {
    // 먼저 테스트 페이지로 이동하여 테스트 사용자로 로그인
    await page.goto('/test');

    // 테스트 사용자 버튼이 있는지 확인하고 클릭
    const testUserButton = page.getByRole('button', { name: '테스트 사용자' }).first();
    if (await testUserButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testUserButton.click();
    }

    // 메인 페이지로 이동
    await page.goto('/');

    // 로그인 상태 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 5000 });

    // 로그아웃 버튼 클릭
    const logoutButton = page.getByRole('button', { name: '로그아웃' });
    await logoutButton.click();

    // 로그아웃 확인 - 로그인 버튼이 다시 나타나는지 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible({ timeout: 5000 });

    // 로그아웃 버튼이 더 이상 보이지 않는지 확인
    const logoutButtonAfter = page.getByRole('button', { name: '로그아웃' });
    const isLogoutButtonStillVisible = await logoutButtonAfter.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isLogoutButtonStillVisible).toBeFalsy();
  });

  test('AUTH-08: 회원가입 시 비밀번호 불일치 에러', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 회원가입 링크 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // ===== Step 1: 이름 입력 =====
    const nameInput = page.locator('input[placeholder="이름을 입력해주세요"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('테스트사용자');

    // Step 1 → Step 2로 이동
    const nextButtons = page.locator('button').filter({ hasText: /^다음$/ });
    await nextButtons.first().click();

    // ===== Step 2: 이메일 입력 =====
    const emailInput = page.locator('input[placeholder="example@email.com"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('newtest@example.com');

    // Step 2 → Step 3으로 이동
    await nextButtons.first().click();

    // ===== Step 3: 비밀번호 입력 (불일치) =====
    const passwordFields = page.locator('input[type="password"]');
    await expect(passwordFields.first()).toBeVisible({ timeout: 5000 });

    const allPasswordFields = await page.locator('input[type="password"]').all();
    await allPasswordFields[0].fill('TestPassword123');
    await allPasswordFields[1].fill('DifferentPassword123'); // 다른 비밀번호

    // 비밀번호 불일치 메시지 확인
    const errorMessage = page.locator('text=/비밀번호가 일치하지 않습니다/');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // 다음 버튼이 비활성화 되어 있는지 확인
    const nextButton = nextButtons.first();
    const isDisabled = await nextButton.evaluate((button: HTMLButtonElement) => button.disabled);
    expect(isDisabled).toBeTruthy();
  });

  test('AUTH-09: 회원가입 시 유효한 이메일 형식 검증', async ({ page }) => {
    // 로그인 모달 열기
    await page.getByRole('button', { name: '로그인' }).first().click();

    // 회원가입 링크 클릭
    await page.getByRole('button', { name: '회원가입' }).click();

    // ===== Step 1: 이름 입력 =====
    const nameInput = page.locator('input[placeholder="이름을 입력해주세요"]');
    await nameInput.fill('테스트사용자');

    // Step 1 → Step 2로 이동
    const nextButtons = page.locator('button').filter({ hasText: /^다음$/ });
    await nextButtons.first().click();

    // ===== Step 2: 잘못된 이메일 입력 =====
    const emailInput = page.locator('input[placeholder="example@email.com"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    // 유효한 이메일 입력
    await emailInput.fill('validtest');

    // 다음 버튼 클릭 시도
    const nextButton = nextButtons.first();
    let isDisabled = await nextButton.evaluate((button: HTMLButtonElement) => button.disabled);
    expect(isDisabled).toBeTruthy(); // 유효하지 않은 이메일이므로 비활성화

    // 유효한 이메일로 수정
    await emailInput.fill('validtest@example.com');

    // 다시 확인
    isDisabled = await nextButton.evaluate((button: HTMLButtonElement) => button.disabled);
    expect(isDisabled).toBeFalsy(); // 유효한 이메일이므로 활성화
  });
});
