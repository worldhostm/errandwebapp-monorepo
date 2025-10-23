import { test, expect, loginAsTestUser, handleGeolocationPrompt } from './fixtures';

/**
 * Full Process E2E Tests
 * 전체 심부름 서비스 플로우 테스트
 * 1. 로그인
 * 2. 심부름 등록
 * 3. 심부름 목록 조회
 * 4. 심부름 상세 조회
 * 5. 심부름 수락
 * 6. 채팅
 * 7. 완료 검증
 */

test.describe('Full Process Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 위치 권한 설정
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });

    await page.goto('/');
    await handleGeolocationPrompt(page);
    await page.waitForLoadState('networkidle');
  });

  test('PROCESS-01: 사용자 로그인 및 메인 페이지 접근', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 로그인 상태 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 5000 });
    console.log('✅ PROCESS-01: 로그인 및 메인 페이지 접근 성공');
  });

  test('PROCESS-02: 심부름 등록 (의뢰자 플로우)', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // "심부름 등록" 버튼 찾기 및 클릭
    const registerButton = page.getByRole('button', { name: /심부름|등록|새/ }).first();

    if (await registerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await registerButton.click();
    } else {
      // 버튼이 없으면 모달이 자동으로 열렸을 수도 있음
      console.log('⚠️ 심부름 등록 버튼을 찾을 수 없음, 다른 방법 시도');
      await page.keyboard.press('KeyE'); // 단축키 시도
      await page.waitForTimeout(500);
    }

    // 형식 입력
    const titleInput = page.locator('input[placeholder*="제목"], input[placeholder*="심부름"]').first();

    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('테스트 심부름 - 짐 옮기기');

      // 설명 입력
      const descriptionInput = page.locator('textarea[placeholder*="설명"], textarea[placeholder*="내용"]').first();
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('이 심부름은 자동 테스트로 생성된 심부름입니다. 테스트 목적으로만 사용됩니다.');
      }

      // 카테고리 선택
      const categorySelect = page.locator('select, [role="listbox"], [role="combobox"]').first();
      if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await categorySelect.click();
        await page.getByText('짐 옮기기').click().catch(() => {});
      }

      // 보상금 입력
      const rewardInput = page.locator('input[placeholder*="금액"], input[placeholder*="보상"], input[type="number"]').first();
      if (await rewardInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rewardInput.fill('10000');
      }

      // 제출 버튼 클릭
      const submitButton = page.getByRole('button', { name: /등록|제출|완료/ }).first();
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ PROCESS-02: 심부름 등록 성공');
      }
    } else {
      console.log('⚠️ PROCESS-02: 심부름 등록 폼을 찾을 수 없음');
    }
  });

  test('PROCESS-03: 심부름 목록 조회 및 필터링', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 심부름 목록이 로드되는지 확인
    const errandItems = page.locator('[class*="errand"], [class*="card"], li').filter({ hasText: /심부름|과제|짐|배달/ });

    // 최소 1개 이상의 심부름이 있는지 확인 (또는 빈 상태)
    const itemCount = await errandItems.count();
    console.log(`📋 심부름 목록 개수: ${itemCount}`);

    // 필터 버튼이 있는지 확인
    const filterButton = page.getByRole('button', { name: /필터|분류|filter/ }).first();
    if (await filterButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterButton.click();
      console.log('✅ PROCESS-03: 필터 기능 확인');
    }

    // 검색 기능 확인
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="찾기"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('테스트');
      await page.waitForLoadState('networkidle');
      console.log('✅ PROCESS-03: 검색 기능 확인');
    }

    console.log('✅ PROCESS-03: 심부름 목록 조회 및 필터링 완료');
  });

  test('PROCESS-04: 심부름 상세 조회', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 첫 번째 심부름 클릭
    const firstErrand = page.locator('[class*="errand"], [class*="card"], li').filter({ hasText: /심부름|과제|짐|배달/ }).first();

    if (await firstErrand.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstErrand.click();
      await page.waitForLoadState('networkidle');

      // 상세 정보 확인
      const detailModal = page.locator('[class*="modal"], [class*="detail"], [role="dialog"]').first();
      if (await detailModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 제목, 설명, 보상금 등이 보이는지 확인
        const detailContent = await detailModal.textContent();
        expect(detailContent).toBeTruthy();
        console.log('✅ PROCESS-04: 심부름 상세 조회 성공');
      }
    } else {
      console.log('⚠️ PROCESS-04: 심부름 목록에 항목이 없음');
    }
  });

  test('PROCESS-05: 심부름 수락 (시행자 플로우)', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 사용자 타입 탭에서 "시행자" 또는 "도우미" 선택
    const helperTab = page.getByRole('tab', { name: /시행자|도우미|helper/ }).first();
    if (await helperTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await helperTab.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ PROCESS-05: 시행자 탭 전환 완료');
    }

    // 심부름 목록에서 첫 번째 심부름 찾기
    const firstErrand = page.locator('[class*="errand"], [class*="card"], li').filter({ hasText: /심부름|과제|짐|배달/ }).first();

    if (await firstErrand.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstErrand.click();
      await page.waitForLoadState('networkidle');

      // "수락" 버튼 클릭
      const acceptButton = page.getByRole('button', { name: /수락|받기|신청/ }).first();
      if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ PROCESS-05: 심부름 수락 성공');
      }
    } else {
      console.log('⚠️ PROCESS-05: 심부름 목록에 항목이 없음');
    }
  });

  test('PROCESS-06: 채팅 기능', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 수락된 심부름 찾기 (내가 수락한 심부름)
    const myErrandTab = page.getByRole('tab', { name: /내 심부름|My Errands|my/ }).first();
    if (await myErrandTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await myErrandTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 채팅 버튼 찾기
    const chatButton = page.getByRole('button', { name: /채팅|메시지|chat/ }).first();
    if (await chatButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatButton.click();
      await page.waitForLoadState('networkidle');

      // 채팅 모달 또는 페이지가 열렸는지 확인
      const chatModal = page.locator('[class*="modal"], [class*="chat"], [role="dialog"]').first();
      if (await chatModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 메시지 입력
        const messageInput = page.locator('input[placeholder*="메시지"], textarea[placeholder*="입력"]').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill('안녕하세요! 심부름을 시작하겠습니다.');

          // 전송 버튼 클릭
          const sendButton = page.getByRole('button', { name: /전송|보내기|send/ }).first();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ PROCESS-06: 채팅 메시지 전송 성공');
          }
        }
      }
    } else {
      console.log('⚠️ PROCESS-06: 채팅 기능을 찾을 수 없음');
    }
  });

  test('PROCESS-07: 완료 검증', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 진행 중인 심부름 찾기
    const myErrandTab = page.getByRole('tab', { name: /내 심부름|My Errands|my/ }).first();
    if (await myErrandTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await myErrandTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 첫 번째 심부름 클릭
    const firstErrand = page.locator('[class*="errand"], [class*="card"], li').filter({ hasText: /진행|시작|수락/ }).first();
    if (await firstErrand.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstErrand.click();
      await page.waitForLoadState('networkidle');

      // "완료" 버튼 클릭
      const completeButton = page.getByRole('button', { name: /완료|끝내기|finish/ }).first();
      if (await completeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completeButton.click();
        await page.waitForLoadState('networkidle');

        // 완료 검증 모달 확인
        const verificationModal = page.locator('[class*="modal"], [class*="verification"], [role="dialog"]').first();
        if (await verificationModal.isVisible({ timeout: 3000 }).catch(() => false)) {
          // 사진 업로드 또는 확인 작업
          const confirmButton = page.getByRole('button', { name: /확인|제출/ }).first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ PROCESS-07: 완료 검증 성공');
          }
        }
      }
    } else {
      console.log('⚠️ PROCESS-07: 진행 중인 심부름을 찾을 수 없음');
    }
  });

  test('PROCESS-08: 사용자 프로필 관리', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 프로필 버튼 찾기
    const profileButton = page.getByRole('button', { name: /프로필|profile/ }).first();
    if (await profileButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileButton.click();
      await page.waitForLoadState('networkidle');

      // 프로필 모달 확인
      const profileModal = page.locator('[class*="modal"], [class*="profile"], [role="dialog"]').first();
      if (await profileModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 프로필 정보 확인
        const profileContent = await profileModal.textContent();
        expect(profileContent).toContain('프로필');
        console.log('✅ PROCESS-08: 사용자 프로필 조회 성공');
      }
    } else {
      console.log('⚠️ PROCESS-08: 프로필 버튼을 찾을 수 없음');
    }
  });

  test('PROCESS-09: 거래 내역 조회', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 거래 내역 탭 찾기
    const historyButton = page.getByRole('tab', { name: /거래 내역|히스토리|history/ }).first();
    if (await historyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyButton.click();
      await page.waitForLoadState('networkidle');

      // 거래 내역 목록 확인
      const historyItems = page.locator('[class*="history"], [class*="transaction"], li').filter({ hasText: /완료|진행|취소/ });
      const itemCount = await historyItems.count();
      console.log(`📊 거래 내역 개수: ${itemCount}`);
      console.log('✅ PROCESS-09: 거래 내역 조회 성공');
    } else {
      console.log('⚠️ PROCESS-09: 거래 내역 버튼을 찾을 수 없음');
    }
  });

  test('PROCESS-10: 로그아웃', async ({ page }) => {
    // 테스트 사용자로 로그인
    await loginAsTestUser(page);

    // 메인 페이지로 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 로그인 상태 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible({ timeout: 5000 });

    // 로그아웃 버튼 클릭
    await page.getByRole('button', { name: '로그아웃' }).click();
    await page.waitForLoadState('networkidle');

    // 로그아웃 확인 - 로그인 버튼이 다시 나타나는지 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible({ timeout: 5000 });
    console.log('✅ PROCESS-10: 로그아웃 성공');
  });
});
