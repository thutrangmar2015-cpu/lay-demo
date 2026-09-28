"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { CHALLENGES, MAX_IMAGE_SIDE, type Challenge } from "@/lib/config";
import type { MixResult } from "@/lib/types";

type Step = "intro" | "challenge" | "preview" | "loading" | "result";

const LOAD_LINES = [
  "Đang tính toán đại đại...",
  "Đang soi từng góc ảnh...",
  "Đang thử mix trong đầu...",
  "Nghe giòn rồi đó...",
];

function pickChallenge(exceptId?: string): Challenge {
  const pool = CHALLENGES.filter((c) => c.id !== exceptId);
  return pool[Math.floor(Math.random() * pool.length)] || CHALLENGES[0];
}

async function resizeImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("load"));
      i.src = url;
    });
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function Game() {
  const [step, setStep] = useState<Step>("intro");
  const [challenge, setChallenge] = useState<Challenge>(CHALLENGES[0]);
  const [spinning, setSpinning] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<MixResult | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadLine, setLoadLine] = useState(0);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Quay thử thách kiểu máy xèng
  function spin() {
    setStep("challenge");
    setSpinning(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 0;
    let last = challenge.id;
    const total = reduce ? 1 : 10;
    const tick = () => {
      const next = pickChallenge(last);
      last = next.id;
      setChallenge(next);
      n++;
      if (n < total) setTimeout(tick, 60 + n * 18);
      else setSpinning(false);
    };
    tick();
  }

  useEffect(() => {
    if (step !== "loading") return;
    const t = setInterval(() => setLoadLine((l) => (l + 1) % LOAD_LINES.length), 1300);
    return () => clearInterval(t);
  }, [step]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    try {
      setPhoto(await resizeImage(f));
      setTried([]);
      setStep("preview");
    } catch {
      setError("Không đọc được ảnh này. Hãy chụp lại hoặc chọn ảnh JPG/PNG khác.");
    }
  }

  async function runMix(avoid: string[]) {
    if (!photo) return;
    setError(null);
    setLoadLine(0);
    setStep("loading");
    try {
      const res = await fetch("/api/mix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, challengeId: challenge.id, avoid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi, thử lại nhé.");
      setResult(data);
      setTried([...avoid, data.ingredient]);
      setStep("result");
    } catch (err) {
      setError((err as Error).message);
      setStep(result ? "result" : "preview");
    }
  }

  function retake() {
    setPhoto(null);
    setResult(null);
    setTried([]);
    spin();
  }

  async function saveCard() {
    if (!cardRef.current || !result) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "lays-mix-dai-dai.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: result.mixName, text: "AI của Lay's vừa ra công thức này cho mình 😂" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Chưa lưu được ảnh. Hãy chụp màn hình thay thế nhé.");
    } finally {
      setSaving(false);
    }
  }

  const fileInputs = (
    <>
      <input id="cam" className="sr" type="file" accept="image/*" capture="environment" onChange={onFile} />
      <input id="lib" className="sr" type="file" accept="image/*" onChange={onFile} />
    </>
  );

  return (
    <main className="stage">
      {fileInputs}

      {step === "intro" && (
        <>
          <section className="paper">
            <h1 className="title"><span>Chụp Đại</span><span>Mix Đại</span></h1>
            <div className="rule" />
            <p className="lede">Lay&apos;s giòn chấn động, nên mix đại đại với gì cũng vẫn ngon.</p>
            <p className="small">Nhận một thử thách chụp ảnh ngẫu nhiên. AI của Lay&apos;s sẽ soi ảnh và ra cho bạn một công thức mix không ai ngờ tới.</p>
          </section>
          <button className="btn btn-red" onClick={spin}>Nhận thử thách</button>
        </>
      )}

      {step === "challenge" && (
        <>
          <div className={`ribbon ${spinning ? "spinning" : ""}`} aria-live="polite">
            <span className="top">{challenge.top}</span>
            <span className="main">{challenge.main}</span>
            <span className="sub">{challenge.sub}</span>
          </div>
          <p className="hint">{spinning ? "Đang chọn thử thách..." : challenge.hint}</p>
          {!spinning && (
            <div className="btns">
              <label htmlFor="cam" className="btn btn-red">📸 Chụp ngay</label>
              <label htmlFor="lib" className="btn btn-cream">Chọn ảnh có sẵn</label>
              <button className="link" onClick={spin}>Đổi thử thách khác</button>
            </div>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}

      {(step === "preview" || step === "loading") && photo && (
        <>
          <div className={`phone ${step === "loading" ? "quake" : ""}`}>
            <div className="shot">
              <img src={photo} alt="Ảnh bạn vừa chụp" />
              <div className="brackets"><i /><i /><i /><i /></div>
              <span className="tag">{challenge.top} {challenge.main}</span>
              {step === "loading" && <div className="scan" />}
            </div>
          </div>
          {step === "preview" ? (
            <div className="btns">
              <button className="btn btn-red" onClick={() => runMix([])}>Cho AI tính toán</button>
              <label htmlFor="cam" className="btn btn-cream">Chụp lại</label>
            </div>
          ) : (
            <p className="loadtext" aria-live="polite">{LOAD_LINES[loadLine]}</p>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}

      {step === "result" && result && (
        <>
          <div ref={cardRef} className="card">
            <div className="card-head">
              <div className="combo">
                <span className="l">Lay&apos;s</span>
                <span className="plus">+</span>
                <span className="l">{result.ingredient}</span>
                <span className="plus">+</span>
                <span className="l">{result.partner}</span>
              </div>
              <div className="icons" aria-hidden="true">
                <div className="bag"><span>Lay&apos;s</span></div>
                <b>+</b>{result.ingredientEmoji}<b>+</b>{result.partnerEmoji}
              </div>
            </div>
            <div className="card-body">
              <h2 className="name">{result.mixName}</h2>
              <div className="why">
                {photo && <img src={photo} alt="" />}
                <p><strong>AI thấy {result.seen}.</strong> {result.bridge}</p>
              </div>
              <ol className="steps">
                {result.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <div className="meter">
                <div className="meter-label"><span>Độ giòn chấn động</span><span>{result.crunch}/10</span></div>
                <div className="bars">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < result.crunch ? "on" : ""} />)}</div>
              </div>
              <p className="verdict">{result.verdict}</p>
              <p className="foot">Chụp Đại Mix Đại cùng Lay&apos;s</p>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-cream" onClick={retake}>↻ Chụp lại</button>
            <button className="btn btn-red" onClick={() => runMix(tried)}>Thử món khác</button>
          </div>
          <button className="btn btn-red" onClick={saveCard} disabled={saving}>{saving ? "Đang lưu..." : "Lưu và chia sẻ công thức"}</button>
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}
    </main>
  );
}
