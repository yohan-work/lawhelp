# lawhelp — 규칙형 법령 질의 안내 (MVP)

생성형 AI(LLM) 없이 **JSON 데이터**와 **규칙·점수 기반 매칭**만으로 답변을 구성하는 주택임대차보호법 안내용 웹앱입니다. **법률 자문이 아니며**, 데이터에 실린 문구를 조합해 안내합니다.

## 요구 사항

- Node.js 20 이상 권장
- npm

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

| 경로 | 역할 |
|------|------|
| `app/page.tsx` | 채팅형 메인 UI (클라이언트) |
| `app/api/chat/route.ts` | 질문 POST → 매칭 결과 JSON |
| `components/` | 말풍선, 응답 카드, 예시 질문 |
| `lib/match/` | 정규화, 점수, 매칭 엔진 |
| `lib/data/` | zod 스키마, JSON 로드 |
| `data/source/` | 법령 원문·조문 **앱용** JSON (`housing-rental-protection.json`) |
| `data/source/raw/` | 워드 파싱 **raw** (단락 보존) |
| `data/source/generated/` | 스크립트 **자동 생성** cleaned 초안 (`*.generated.json`) |
| `data/response/intents.json` | intent·답변·키워드·패턴 |
| `data/dictionaries/` | 동의어, 주제→조문 맵 |
| `scripts/parse-word.ts` | 워드/RTF/docx → raw + generated |
| `scripts/parse-rules/` | 법령별 조문 분리 패턴 등 설정 |
| `types/` | TypeScript 타입 |

매칭은 **서버(API Route)** 에서만 수행합니다. 클라이언트에 전체 JSON을 내리지 않습니다.

## 워드 문서 → JSON

1. 원본은 `dataset/` 등에 둡니다. 확장자가 `.doc`이어도 내용이 **RTF**인 경우가 많습니다. 스크립트는 파일 앞부분이 `{\rtf` 이면 RTF로 처리합니다.
2. **바이너리 .doc**(OLE)은 `word-extractor`로, **.docx**는 `mammoth`로 텍스트를 뽑습니다.
3. RTF는 먼저 `rtf-parser`를 시도하고, 비표준 문서는 **단순 제어어 제거 폴백**으로 텍스트만 추출합니다(이후 **수동 보정** 전제).

```bash
npm run parse:word -- ./dataset/문서.doc ./data/source
```

- **raw**: `data/source/raw/<lawId>-raw.json`
- **cleaned 초안**: `data/source/generated/<lawId>.generated.json`  
  앱이 읽는 `data/source/housing-rental-protection.json`은 **덮어쓰지 않습니다.** 생성본을 검수·편집한 뒤 필요 시 앱용 파일로 합치거나 교체하세요.

### 조문 분리가 깨질 때

문서 안의 다른 법령 인용(예: 민법 `제575조`)까지 `제N조` 패턴에 걸리면 조문이 잘못 나뉩니다. 이 경우:

- `scripts/parse-rules/` 의 패턴을 조정하거나
- raw JSON을 수동으로 고친 뒤 cleaned를 편집하거나
- 국가법령정보센터 등에서 구조화된 원문을 참고해 `data/source/*.json`을 직접 유지합니다.

## 데이터 추가 방법

1. **`data/source/<lawId>.json`**  
   `lawId`, `lawName`, `sourceUrl`, `articles[]` (`articleNo`, `fullText`, 선택 `title`, `keywords`, `relatedArticleNos`).
2. **`data/response/intents.json`**  
   같은 `lawId`를 맞추고 `intents[]`에 `intentPatterns`, `keywords`, `synonyms`, `answerSummary`, `answerDetail`, `cautions`, `relatedArticleNos` 등을 추가합니다.
3. **`lib/data/loadDatasets.ts`**  
   파일명·경로를 바꿀 경우 이 모듈의 읽기 경로를 수정합니다.
4. **`data/dictionaries/synonym-dictionary.json`**  
   사용자 표현 → 내부 키워드 치환을 추가합니다.

법령별 전용 하드코딩은 최소화했고, `lawId`·파일 분리로 다른 법령을 추가할 수 있습니다.

## 무료 배포 (예: Vercel)

- 저장소를 연결한 뒤 **Framework Preset: Next.js**, Build: `npm run build`, Output: 기본값.
- 환경 변수는 MVP 기준 필수 없음.
- `data/` JSON은 저장소에 포함되면 그대로 배포됩니다.

## dataset 폴더와 Git

용량·저작권 정책에 따라 `dataset/` 원본 워드를 저장소에 넣지 않을 수 있습니다. 이 경우 `.gitignore`에 `dataset/`을 추가하고, 팀 내에서는 별도로 원본을 공유하세요.

## 스택

Next.js 15 (App Router), TypeScript, Tailwind CSS, zod, fuse.js(퍼지 보조), mammoth, word-extractor, rtf-parser(실패 시 폴백).

## 면책

이 프로젝트는 정보 안내용이며 법률 자문을 제공하지 않습니다. 항상 국가법령정보센터 등 **공식 원문**과 전문가 의견을 확인하세요.
