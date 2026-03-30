# lawhelp — 규칙형 법령 질의 안내 (MVP)

생성형 AI(LLM) 없이 **JSON 데이터**와 **규칙·점수 기반 매칭**만으로 답변을 구성하는 주택임대차보호법 안내용 웹앱입니다. **법률 자문이 아니며**, 데이터에 실린 문구를 조합해 안내합니다.

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

## 평문 법령(`dataset/data`) → 원문 JSON 일괄 반영

국가법령정보센터 등에서 붙여 넣은 **줄 단위 평문**이 `dataset/data`(확장자 없음 가능)에 있을 때, 조문·부칙을 나눠 앱용 파일을 **덮어씁니다**.

```bash
npm run build:statute
# 또는: npx tsx scripts/build-statute-from-dataset.ts ./dataset/data
```

- **출력**: `data/source/housing-rental-protection.json`, `data/guide/housing-rental-guide.json`
- 각 조는 `lines` 한 행에 전체 원문이 들어가고, 쉬운 해석 칸은 비어 있습니다(이후 워드 `parse:guide -- --write-guide` 등으로 보강 가능).
- 부칙은 `articleNo: "부칙"` 한 항목으로 붙습니다. 부칙 안의 `제1조(시행일)` 등은 조문으로 쪼개지 않습니다.
- 실행 후 `data/response/intents.json`의 `relatedArticleNos`가 실제 조번과 맞는지, 필요하면 `topic-map.json`도 함께 점검하세요.

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

## 쉬운 해설 페이지(`/guide`) — 워드 → JSON

1. 워드 작성 규칙: `docs/word-template-law-guide.md` (조문당 `쉬운 해석:` 한 번, 또는 줄 단위 `<<<원문>>>` / `<<<쉬운>>>` 반복).
2. 파싱:

```bash
npm run parse:guide -- ./dataset/문서.doc
```

- `data/source/raw/<lawId>-guide-raw.json`, `data/source/generated/<lawId>-from-guide.generated.json` 이 생성됩니다. `parseWarnings`로 누락·마커 오류를 확인하세요.

3. 앱이 읽는 가이드 데이터로 바로 쓰려면:

```bash
npm run parse:guide -- ./dataset/문서.doc --write-guide
```

- `data/guide/housing-rental-guide.json` 이 갱신됩니다. **검수 후 커밋**하면 배포 환경에도 동일하게 반영됩니다.

4. 정적 페이지: `/guide` 는 위 JSON만 사용합니다. `docs/easy-interpretation.md` 는 참고용(과거 수동 정리)입니다.