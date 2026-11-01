# 팜가디언 FE

농약을 뿌려도 되는지 네 가지로 따져 주는 모바일 웹.

```
①등록  이 작물 이 병해충에 쓸 수 있는 약인가
②시기  수확까지 며칠 남았나 (PHI)
③횟수  올해 더 뿌려도 되나
④계통  직전과 같은 계통인가 (저항성)
```

## 띄우기

```bash
npm install
npm run dev     # http://localhost:8443
```

빌드는 `npm run build`, 미리보기는 `npm run preview`.

## 지금 상태

**화면만 있다. 서버를 안 붙였다.** 모든 데이터는 `src/data/mock.ts` 안에 있고,
상태는 `src/state/AppState.tsx`의 `useState`로만 돈다. 새로고침하면 처음으로 돌아간다.

디자인을 먼저 굳히고 API를 한 번에 요청하려고 이렇게 뒀다.

## 어디부터 보면 되나

| 파일 | 하는 일 |
| --- | --- |
| `src/lib/verdict.ts` | **판정 로직 전부.** 네 가지를 따져서 5상태 중 하나를 낸다 |
| `src/data/mock.ts` | 가짜 데이터. 약·병해충·구역·살포기록·지역통계 |
| `src/state/AppState.tsx` | 앱 전역 상태. 서버를 붙이면 여기만 갈아 끼우면 된다 |
| `src/index.css` | 디자인 토큰 전부 (`:root` 블록). 색·글자크기·간격·모서리 |

화면은 `src/screens/`에 아홉 개.

```
Login       랜딩 + 카카오 로그인
MapHome     첫 화면. 밭 지도 + 아래 시트
PestSelect  병해충 고르기
DrugList    그 병해충에 등록된 약 목록 (판정 붙은 채로)
Verdict     약 하나 판정 상세. 네 가지 체크 + 근거 원문
ScanSheet   봉지 찍어서 약 찾기 (OCR 자리)
History     살포 이력
Dashboard   통계. 계통 쏠림 + 다음에 쓸 약
Fields      밭·구역 관리
```

## 판정 5상태

```ts
ok        가능       네 가지 다 통과
caution   주의       ④계통만 걸림 (법 위반은 아니지만 약이 덜 듣는다)
no        불가       ①②③ 중 하나라도 걸림 (출하가 막힌다)
unknown   확인 필요   자료가 비어서 따질 수 없다
preplant  심을 때     아직 안 심어서 따질 때가 아니다
```

`unknown`과 `preplant`를 나눈 게 핵심이다. 빈칸을 통과로 넘기지 않는다.

## 서버를 붙일 때

`AppState.tsx`가 전부 `useState`다. 이걸 API 호출로 바꾸면 화면은 안 건드려도 된다.

명세에 아직 없어서 추가로 필요한 API는 `docs/api-wanted.md`에 모아 뒀다.

## 규칙

- **API 키를 FE에 넣지 않는다.** 전부 서버 환경변수로.
- `.env`는 `.gitignore`에 들어 있다. 올리지 말 것.
- 폭은 `--app-max: 430px` 고정. PC에서도 모바일 폭으로 본다.
