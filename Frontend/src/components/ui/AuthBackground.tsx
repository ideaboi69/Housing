"use client";

export function AuthBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ background: "linear-gradient(180deg, #F7F2EA 0%, #F2EADF 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "linear-gradient(rgba(27,45,69,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(27,45,69,0.022) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(circle at center, black 34%, transparent 86%)",
        }}
      />
      <div className="absolute" style={{ top: "-140px", right: "-80px", width: "480px", height: "480px", borderRadius: "50%", background: "rgba(255,107,53,0.10)", filter: "blur(110px)" }} />
      <div className="absolute" style={{ bottom: "-160px", left: "-90px", width: "420px", height: "420px", borderRadius: "50%", background: "rgba(27,45,69,0.06)", filter: "blur(120px)" }} />
      <div className="absolute" style={{ top: "17%", left: "8%", width: "38%", height: "1px", background: "rgba(27,45,69,0.12)", transform: "rotate(-10deg)" }} />
      <div className="absolute" style={{ top: "25%", left: "10%", width: "28%", height: "1px", background: "rgba(27,45,69,0.08)", transform: "rotate(-10deg)" }} />
      <div className="absolute" style={{ bottom: "16%", right: "8%", width: "24%", height: "1px", background: "rgba(27,45,69,0.10)", transform: "rotate(9deg)" }} />
      <div className="absolute" style={{ top: "54%", right: "16%", width: "180px", height: "180px", borderRadius: "50%", border: "1px solid rgba(27,45,69,0.08)" }} />
      <div className="absolute" style={{ top: "57%", right: "19%", width: "120px", height: "120px", borderRadius: "50%", border: "1px solid rgba(255,107,53,0.12)" }} />
    </div>
  );
}
