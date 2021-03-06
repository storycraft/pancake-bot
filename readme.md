# Pancake bot
![pancake](resources/pan.png)

채팅방 관리, 채팅 기록, 이미지 편집 등등 각종 편의 기능이 있는 카카오톡 봇

\* 해당 봇은 `node-kakao-db`를 사용하여 모든 채팅을 기록합니다.

## 실행하기
봇을 실행하려면 환경변수를 통해 봇 계정 정보를 제공해야 합니다.

BOT_DEVICE_NAME
카카오톡에 표시되는 기기 이름

BOT_DEVICE_UUID
기기 UUID

BOT_ACCOUNT_EMAIL
계정 이메일 주소

BOT_ACCOUNT_PWD
계정 비밀번호

## 커스터마이징
모듈들은 `index.ts` 수정을 통해 추가/제거 할 수 있습니다. 모듈 제작은 [`modules/example/index.ts`](modules/example/index.ts)를 참고하세요.

## 모바일 구동
현재 `node-kakao-db`에서 사용하는 `better-sqlite3-sqlcipher` 라이브러리가 안드로이드 빌드를 지원하지 않습니다.
[이곳](https://github.com/storycraft/better-sqlite3-sqlcipher)에서 안드로이드 prebuilt가 포함된 포크를 clone해 빌드후 링크해 사용하시면 됩니다.

## 사용법
콘솔, 봇 도움말을 보려면 콘솔 창에 `man`, 채팅에 `-man`을 입력해 보세요.

## 권한
명령어 권한은 오픈 채팅방과 동일하게 총 3단계로 나누어져 있습니다. 하위 권한을 가진 사용자는 상위 권한이 필요한 명령어를 실행하지 못합니다.
sudo 모듈은 특정 유저가 상위 권한 커맨드를 사용할 수 있도록 도와줍니다.
일반 채팅방의 경우 오픈 채팅방의 부관리자와 같은 수준의 권한을 모든 사용자가 갖습니다.

## 기본 포함된 모듈 목록
1. chat: 채팅 기록, 채팅 필터링 기능 제공
2. hash: 해시, base64 등 해시 및 인코딩 명령어 제공
3. misc: 말하기, roll 기능등 잡다한 기능이 포함된 모듈
4. images: 명령어를 통한 사진 편집 기능 제공 모듈
5. open channel manager: 오픈 채팅방 소프트 킥 기능등 오픈 채팅방 관리 모듈
6. util: 콘솔 창에서 방 목록 보기, 오픈 채팅방 참가, 채팅방 나가기, 봇 재로그인 등 편의 기능 제공
7. sudo: 관리자가 아닌 유저가 관리자 권한으로 명령어를 사용할 수 있도록 도와주는 모듈
8. man: 명령어 도움말 제공 모듈
9. ytdl: 유튜브 영상 오디오 추출 모듈
10. inspect: 채팅방 및 유저 정보 inspect 모듈