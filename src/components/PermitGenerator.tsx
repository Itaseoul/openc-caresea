"use client";

import { useState } from "react";
import {
  SPOTS,
  requiredPermits,
  pathway,
  requirements,
  docBusinessPlan,
  docCctvPlan,
  docAdminNotice,
  docPrivacyNotice,
  docMou,
  docRestorationPlan,
  docFoiaLocal,
  docFoiaHeritage,
  docConsultLetter,
  type Spot,
  type UseType,
} from "./permitData";

const zoneStyle: Record<string, { bg: string; fg: string }> = {
  밖: { bg: "#ecfdf5", fg: "#16a34a" },
  확인필요: { bg: "#fffbeb", fg: "#b45309" },
  안: { bg: "#fef2f2", fg: "#dc2626" },
};

function CopyBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>{title}</div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(text).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => {}
            );
          }}
          style={{
            fontSize: 11, fontWeight: 700, color: copied ? "#16a34a" : "#0e7490",
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7,
            padding: "3px 9px", cursor: "pointer",
          }}
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre
        style={{
          margin: 0, padding: "11px 12px", background: "#0f172a", color: "#e2e8f0",
          borderRadius: 10, fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
          wordBreak: "break-word", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

export default function PermitGenerator() {
  const [id, setId] = useState<string>(SPOTS.find((s) => s.recommended)?.id ?? SPOTS[0].id);
  const [use, setUse] = useState<UseType>("boom");
  const spot: Spot = SPOTS.find((s) => s.id === id) ?? SPOTS[0];
  const z = zoneStyle[spot.zone];
  const permits = requiredPermits(spot, use);
  const steps = pathway(spot, use);
  const reqs = requirements(spot, use);
  const foiaHeritage = docFoiaHeritage(spot);

  const useTabs: { key: UseType; label: string }[] = [
    { key: "boom", label: "부유식 붐 실증" },
    { key: "cctv", label: "환경감시 CCTV" },
  ];

  return (
    <div>
      {/* 용도 토글 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {useTabs.map((t) => {
          const on = t.key === use;
          return (
            <button
              key={t.key}
              onClick={() => setUse(t.key)}
              style={{
                fontSize: 12.5, fontWeight: 800,
                color: on ? "#fff" : "#475569",
                background: on ? "#0f172a" : "#f1f5f9",
                border: "1px solid " + (on ? "#0f172a" : "#e2e8f0"),
                borderRadius: 9, padding: "7px 14px", cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 스팟 선택 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SPOTS.map((s) => {
          const active = s.id === id;
          return (
            <button
              key={s.id}
              onClick={() => setId(s.id)}
              style={{
                fontSize: 12.5, fontWeight: 700,
                color: active ? "#fff" : "#334155",
                background: active ? "#0e7490" : "#fff",
                border: "1px solid " + (active ? "#0e7490" : "#e2e8f0"),
                borderRadius: 999, padding: "6px 12px", cursor: "pointer",
              }}
            >
              {s.stream}
              {s.recommended ? " ★" : ""}
            </button>
          );
        })}
      </div>

      {/* 스팟 요약 */}
      <div style={{ marginTop: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{spot.stream}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>{spot.region} · {spot.grade}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: z.fg, background: z.bg, border: "1px solid " + z.fg + "33", borderRadius: 999, padding: "2px 9px" }}>
            보호구역 {spot.zone}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.6 }}>{spot.context}</div>
        <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>점용허가 처분청: <b>{spot.authority}</b> · 위치: {spot.coord}</div>
      </div>

      {/* 필요한 허가 */}
      <Block title="필요한 허가">
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
          {permits.map((p) => (
            <div key={p.name} style={{ borderLeft: "3px solid #0e7490", padding: "2px 0 2px 10px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                {p.name}{" "}
                {p.flag && (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: p.flag === "선결" ? "#dc2626" : "#b45309" }}>· {p.flag}</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 1 }}>{p.agency} · {p.basis}</div>
              {p.note && <div style={{ fontSize: 11, color: "#b45309", marginTop: 1 }}>{p.note}</div>}
            </div>
          ))}
        </div>
      </Block>

      {/* 협의 순서 */}
      <Block title="협의·진행 순서">
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#334155", lineHeight: 1.8 }}>
          {steps.map((st, i) => <li key={i}>{st}</li>)}
        </ol>
      </Block>

      {/* 요건 체크리스트 */}
      <Block title={use === "cctv" ? "요건 체크리스트 (개인정보 보호법 §25 · 프라이버시 · 점용)" : "요건 체크리스트 (「하천점용허가 세부기준」)"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
          {reqs.map((r) => (
            <div key={r.clause} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
              <span style={{ flex: "0 0 auto", color: "#94a3b8" }}>☐</span>
              <span style={{ flex: "0 0 auto", fontWeight: 700, color: "#0e7490", minWidth: 92 }}>{r.clause}</span>
              <span style={{ color: "#475569", lineHeight: 1.5 }}>{r.item}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* 문서팩 */}
      <Block title="사전채움 문서팩 (초안)">
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
          스팟 데이터로 자동 채움. 〔 〕 항목과 수치는 현장값으로 보완하고, 제출 전 최신 판본·처분청을 확인하세요.
        </div>
        {use === "cctv" ? (
          <>
            <CopyBlock title="① CCTV 설치 사업(점용)계획서" text={docCctvPlan(spot)} />
            <CopyBlock title="② 원상복구계획서" text={docRestorationPlan(spot, "cctv")} />
            <CopyBlock title="③ 행정예고문 (개인정보 보호법 §25)" text={docAdminNotice(spot)} />
            <CopyBlock title="④ 안내판 문구" text={docPrivacyNotice(spot)} />
            <CopyBlock title="⑤ 민관 데이터 공유 협약(MOU) 초안" text={docMou(spot)} />
            <CopyBlock title={"⑥ 정보공개청구서 — " + spot.region + "청"} text={docFoiaLocal(spot)} />
            {foiaHeritage && <CopyBlock title="⑦ 정보공개청구서 — 국가유산청" text={foiaHeritage} />}
            <CopyBlock title="⑧ 사전 협의 요청 공문" text={docConsultLetter(spot, "cctv")} />
          </>
        ) : (
          <>
            <CopyBlock title="① 점용허가 사업계획서" text={docBusinessPlan(spot)} />
            <CopyBlock title="② 원상복구계획서" text={docRestorationPlan(spot, "boom")} />
            <CopyBlock title={"③ 정보공개청구서 — " + spot.region + "청"} text={docFoiaLocal(spot)} />
            {foiaHeritage && <CopyBlock title="④ 정보공개청구서 — 국가유산청" text={foiaHeritage} />}
            <CopyBlock title="⑤ 사전 협의 요청 공문" text={docConsultLetter(spot, "boom")} />
          </>
        )}
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
