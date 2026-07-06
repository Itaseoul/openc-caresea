// 드리프터 데이터 저장소 — 백엔드 선택(R2 우선, 없으면 로컬 파일).
// R2가 설정되어 있으면 공유 데이터 평면(seacut이 읽는 동일 버킷)에 쓰고, 없으면 개발/벤치용
// 로컬 파일에 쓴다. 운영(Vercel 등 서버리스)에서는 파일이 휘발성이므로 반드시 R2를 설정한다.
//
// 저장 키(경로) — seacut 정적 사이트가 같은 버킷에서 이 경로들을 읽어 렌더한다:
//   원본 단건 ping   : seacut/data/drift/pings.ndjson
//   완성 궤적 업로드  : seacut/data/drift/tracks.ndjson
//   공개 스냅샷(지도) : seacut/drift/live.geojson   (PII 최소화·익명 id)

import { promises as fs } from "fs";
import path from "path";
import { r2Configured, r2GetText, r2PutText } from "@/lib/r2";

const DATA_DIR = process.env.DRIFT_DATA_DIR || path.join(process.cwd(), ".data");

export const DRIFT_KEYS = {
  pings: "seacut/data/drift/pings.ndjson",
  tracks: "seacut/data/drift/tracks.ndjson",
  live: "seacut/drift/live.geojson",
} as const;

async function getText(key: string): Promise<string | null> {
  if (r2Configured()) return r2GetText(key);
  try {
    return await fs.readFile(path.join(DATA_DIR, key), "utf-8");
  } catch {
    return null;
  }
}

async function putText(key: string, body: string, contentType = "application/json"): Promise<void> {
  if (r2Configured()) {
    await r2PutText(key, body, contentType);
    return;
  }
  const p = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body, "utf-8");
}

// NDJSON append. R2에는 append API가 없어 read-modify-write로 이어붙인다(저빈도 PoC 전제 —
// 드리프터 수 대·수십 분 주기 규모. 고빈도·다수 동시 전송은 DB나 큐로 승격).
async function appendLines(key: string, lines: string[]): Promise<void> {
  if (!lines.length) return;
  const blob = lines.join("\n") + "\n";
  if (r2Configured()) {
    const prev = (await r2GetText(key)) || "";
    await r2PutText(key, prev + blob, "application/x-ndjson");
    return;
  }
  const p = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.appendFile(p, blob, "utf-8");
}

function parseNdjson(text: string | null): unknown[] {
  if (!text) return [];
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

export const driftStore = {
  storage: (): "r2" | "file" => (r2Configured() ? "r2" : "file"),
  appendPings: (recs: unknown[]) => appendLines(DRIFT_KEYS.pings, recs.map((r) => JSON.stringify(r))),
  readPings: async (): Promise<unknown[]> => parseNdjson(await getText(DRIFT_KEYS.pings)),
  appendTracks: (recs: unknown[]) => appendLines(DRIFT_KEYS.tracks, recs.map((r) => JSON.stringify(r))),
  readTracks: async (): Promise<unknown[]> => parseNdjson(await getText(DRIFT_KEYS.tracks)),
  writeLive: (geojson: unknown) => putText(DRIFT_KEYS.live, JSON.stringify(geojson), "application/geo+json"),
  readLive: async (): Promise<unknown | null> => {
    const t = await getText(DRIFT_KEYS.live);
    return t ? JSON.parse(t) : null;
  },
};
