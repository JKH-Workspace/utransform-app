# utransform-app

어떤 형태의 입력이든 원하는 JSON 양식으로 변환하는 macOS 데스크톱 앱.

이메일, 슬랙 메시지, 이미지, 웹페이지 등 아무 데이터나 넣으면 미리 등록해둔 JSON 양식으로 자동 변환해준다.
LLM 변환은 로컬의 Claude Code를 사용하므로 별도 서버나 API 키가 필요 없다.

## 사전 요구사항

- macOS (Apple Silicon만 지원)
- Claude Code 설치 및 로그인 완료
- 터미널에서 `claude -p "hello"` 가 동작하는지 확인

## 설치

### 터미널 한 줄 설치 (추천)

```bash
curl -fsSL https://github.com/jkhworkspace/utransform-app/releases/latest/download/uTransform_macos_aarch64.tar.gz | tar -xz -C /Applications/
```

### DMG로 설치

[Releases](https://github.com/jkhworkspace/utransform-app/releases) 페이지에서 `.dmg` 파일을 받아 설치.
브라우저로 다운로드한 경우 Gatekeeper 경고가 뜰 수 있다. 이 경우:

1. 앱을 한 번 실행 시도한다 (차단 알림이 뜸)
2. **시스템 설정 → 개인정보 보호 및 보안** 으로 이동
3. 하단의 **"확인 없이 열기"** 버튼을 클릭

### 소스에서 빌드

[Rust](https://www.rust-lang.org/tools/install)와 Node.js가 필요하다.

```bash
git clone https://github.com/jkhworkspace/utransform-app.git
cd utransform-app
npm install
npm run tauri build
```

빌드 완료 후:
- `src-tauri/target/release/bundle/macos/uTransform.app` → 더블클릭으로 실행
- `src-tauri/target/release/bundle/dmg/` → DMG 설치 파일

설치 후 **별도 서버를 띄울 필요 없이** 앱만 실행하면 된다.
