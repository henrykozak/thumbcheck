// pages/index.js
// Main tool page — free tier gets 3 analyses, then upgrade prompt

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

export default function Home() {
  const { data: session } = useSession();
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [keyword, setKeyword] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setMediaType(file.type);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }, []);

  const analyse = async () => {
    if (!imageBase64 || !keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowUpgrade(false);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, keyword, mediaType }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!session) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const scoreColor = result
    ? result.score >= 70 ? "#22c55e" : result.score >= 45 ? "#FFD700" : "#FF2D2D"
    : "#fff";

  return (
    <>
      <Head>
        <title>ThumbCheck — AI YouTube Thumbnail Analyser</title>
        <meta name="description" content="Upload your YouTube thumbnail and get an instant AI score, competitive analysis, and exactly what to fix to get more clicks." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #080808; color: #F2F2F2; min-height: 100vh; }
        .wrap { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
        .logo { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 3px; margin-bottom: 40px; display: flex; align-items: center; gap: 8px; }
        .dot { width: 8px; height: 8px; background: #FF2D2D; border-radius: 50%; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        h1 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(40px,7vw,80px); line-height:0.95; letter-spacing:2px; margin-bottom: 12px; }
        h1 span { color: #FF2D2D; }
        .sub { color: #555; font-size: 16px; margin-bottom: 40px; line-height: 1.6; }
        .upload { border: 2px dashed #1e1e1e; border-radius: 12px; padding: 48px; text-align: center; cursor: pointer; transition: all 0.2s; background: #101010; position: relative; overflow: hidden; }
        .upload:hover, .upload.drag { border-color: #FF2D2D; background: #150808; }
        .upload.has { padding: 20px; border-style: solid; cursor: default; }
        .upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .upload img { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; }
        .change { margin-top: 10px; background: none; border: 1px solid #1e1e1e; color: #555; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; }
        .row { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin-top: 16px; align-items: end; }
        label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #555; margin-bottom: 8px; }
        input[type=text] { width: 100%; background: #101010; border: 1px solid #1e1e1e; border-radius: 8px; padding: 14px 16px; color: #F2F2F2; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        input[type=text]:focus { border-color: #FF2D2D; }
        input::placeholder { color: #444; }
        .btn { background: #FF2D2D; color: white; border: none; border-radius: 8px; padding: 14px 28px; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn:hover:not(:disabled) { background: #ff4444; transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error { background: #150505; border: 1px solid #3a0a0a; border-radius: 8px; padding: 14px 18px; color: #ff6b6b; font-size: 14px; margin-top: 16px; }
        .loading { text-align: center; padding: 60px; color: #555; }
        .spinner { width: 40px; height: 40px; border: 3px solid #1e1e1e; border-top-color: #FF2D2D; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .results { margin-top: 32px; display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        .score-card { background: #101010; border: 1px solid #1e1e1e; border-radius: 12px; padding: 28px; display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: center; }
        .circle { width: 96px; height: 96px; border-radius: 50%; border: 3px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .circle-num { font-family: 'Bebas Neue', sans-serif; font-size: 38px; line-height: 1; }
        .circle-label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: #555; }
        .score-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .score-card p { color: #555; font-size: 14px; line-height: 1.6; }
        .panel { background: #101010; border: 1px solid #1e1e1e; border-radius: 12px; padding: 24px; }
        .panel-title { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #555; margin-bottom: 16px; }
        .metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .metric { background: #101010; border: 1px solid #1e1e1e; border-radius: 10px; padding: 18px; }
        .metric-name { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #555; margin-bottom: 10px; }
        .bar-track { background: #1e1e1e; border-radius: 4px; height: 5px; margin-bottom: 8px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .metric-val { font-family: 'Bebas Neue', sans-serif; font-size: 26px; line-height: 1; }
        .issue { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #1e1e1e; font-size: 14px; line-height: 1.5; }
        .issue:last-child { border-bottom: none; }
        .tip { display: flex; gap: 12px; padding: 8px 0; font-size: 14px; line-height: 1.5; color: #555; }
        .tip-n { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #FF2D2D; line-height: 1; min-width: 18px; }
        .upgrade-card { background: #150505; border: 2px solid #FF2D2D; border-radius: 12px; padding: 40px; text-align: center; }
        .upgrade-card h2 { font-family: 'Bebas Neue', sans-serif; font-size: 40px; letter-spacing: 2px; margin-bottom: 12px; }
        .upgrade-card p { color: #555; font-size: 15px; margin-bottom: 28px; line-height: 1.6; }
        .upgrade-card .btn { font-size: 16px; padding: 16px 40px; }
        .free-banner { background: #101010; border: 1px solid #1e1e1e; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #555; display: flex; justify-content: space-between; align-items: center; }
        .free-banner a { color: #FF2D2D; text-decoration: none; font-weight: 600; }
        .pro-badge { background: #FF2D2D; color: white; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; margin-left: 8px; }
      `}</style>

      <div className="wrap">
        <div className="logo">
          <div className="dot" />
          THUMBCHECK
          {session && <span className="pro-badge">PRO</span>}
        </div>

        <h1>WILL THEY <span>CLICK</span><br />YOUR THUMBNAIL?</h1>
        <p className="sub">Upload your thumbnail, enter your keyword, get an AI score and fix list in 10 seconds.</p>

        {/* Upload zone */}
        <div
          className={`upload ${dragging ? "drag" : ""} ${image ? "has" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !image && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
          {image ? (
            <>
              <img src={image} alt="preview" />
              <button className="change" onClick={(e) => { e.stopPropagation(); setImage(null); setImageBase64(null); setResult(null); fileRef.current?.click(); }}>
                Change thumbnail
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🖼️</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop your thumbnail here</div>
              <div style={{ color: "#555", fontSize: 14 }}>PNG, JPG, WEBP · click to browse</div>
            </>
          )}
        </div>

        {/* Keyword + button */}
        <div className="row">
          <div>
            <label>Target Search Keyword</label>
            <input
              type="text"
              placeholder="e.g. how to grow on youtube 2024"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyse()}
            />
          </div>
          <button className="btn" onClick={analyse} disabled={!imageBase64 || !keyword.trim() || loading}>
            {loading ? "Analysing..." : "Analyse →"}
          </button>
        </div>

        {/* Free tier banner */}
        {!session && result?.analysesRemaining !== undefined && (
          <div className="free-banner" style={{ marginTop: 12 }}>
            <span>{result.analysesRemaining} free {result.analysesRemaining === 1 ? "analysis" : "analyses"} remaining</span>
            <a href="/pricing">Upgrade for unlimited →</a>
          </div>
        )}

        {error && <div className="error">⚠️ {error}</div>}

        {loading && (
          <div className="loading">
            <div className="spinner" />
            Analysing against competitors...
          </div>
        )}

        {/* Upgrade wall */}
        {showUpgrade && (
          <div className="upgrade-card" style={{ marginTop: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2>YOU'VE HIT THE FREE LIMIT</h2>
            <p>You've used all 3 free analyses. Upgrade to Pro for unlimited analyses, full breakdowns, and competitor previews.</p>
            <button className="btn" onClick={handleUpgrade}>Upgrade to Pro — $9/mo →</button>
          </div>
        )}

        {/* Results */}
        {result && !loading && !showUpgrade && (
          <div className="results">
            {/* Score */}
            <div className="score-card">
              <div className="circle" style={{ borderColor: scoreColor, color: scoreColor }}>
                <span className="circle-num">{result.score}</span>
                <span className="circle-label">/ 100</span>
              </div>
              <div>
                <h3>{result.verdict}</h3>
                <p>{result.summary}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="metrics">
              {Object.entries(result.metrics).map(([k, v]) => {
                const c = v >= 70 ? "#22c55e" : v >= 45 ? "#FFD700" : "#FF2D2D";
                return (
                  <div className="metric" key={k}>
                    <div className="metric-name">{k}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${v}%`, background: c }} /></div>
                    <div className="metric-val" style={{ color: c }}>{v}</div>
                  </div>
                );
              })}
            </div>

            {/* Issues */}
            <div className="panel">
              <div className="panel-title">Issues Found</div>
              {result.issues.map((issue, i) => (
                <div className="issue" key={i}>
                  <span>{issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🟢"}</span>
                  {issue.text}
                </div>
              ))}
            </div>

            {/* Tips — Pro only */}
            {result.tips ? (
              <div className="panel">
                <div className="panel-title">How to Improve</div>
                {result.tips.map((tip, i) => (
                  <div className="tip" key={i}>
                    <span className="tip-n">{i + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            ) : (
              <div className="upgrade-card">
                <div style={{ fontSize: 28, marginBottom: 12 }}>💡</div>
                <h2>UNLOCK YOUR FIX LIST</h2>
                <p>Pro users get a prioritised list of exactly what to change to boost CTR. <strong>Upgrade for $9/mo.</strong></p>
                <button className="btn" onClick={handleUpgrade}>Unlock Improvement Tips →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
