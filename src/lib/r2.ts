// R2 저장 어댑터(S3 호환 API).
// openc는 서버리스라 로컬 파일이 휘발성이므로 드리프터 궤적의 영속 저장은 R2로 한다.
// 이 R2 버킷은 seacut(정적 사이트, uploads.caresea.kr)이 읽는 것과 동일한 공유 데이터 평면이다.
//
// @aws-sdk/client-s3를 동적 로드한다. 운영 배포에서 `npm i @aws-sdk/client-s3` 후 아래 env를
// 설정하면 활성화되고, 미설치·미설정이면 driftStore가 로컬 파일로 폴백하므로 개발/벤치는
// R2 없이도 동작한다. 필요 env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.

const ACCOUNT = process.env.R2_ACCOUNT_ID;
const ACCESS = process.env.R2_ACCESS_KEY_ID;
const SECRET = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;

export function r2Configured(): boolean {
  return Boolean(ACCOUNT && ACCESS && SECRET && BUCKET);
}

let _mod: any = null;
async function sdk(): Promise<any> {
  if (_mod) return _mod;
  // @ts-ignore 운영 전용 의존성. 미설치 시 driftStore가 파일로 폴백하므로 이 경로는 호출되지 않는다.
  _mod = await import("@aws-sdk/client-s3");
  return _mod;
}

let _client: any = null;
async function client(): Promise<any> {
  if (_client) return _client;
  const m = await sdk();
  _client = new m.S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS as string, secretAccessKey: SECRET as string },
  });
  return _client;
}

export async function r2GetText(key: string): Promise<string | null> {
  const m = await sdk();
  const c = await client();
  try {
    const out = await c.send(new m.GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return (await out.Body.transformToString()) as string;
  } catch (e: any) {
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

export async function r2PutText(
  key: string,
  body: string,
  contentType = "application/json"
): Promise<void> {
  const m = await sdk();
  const c = await client();
  await c.send(
    new m.PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}
