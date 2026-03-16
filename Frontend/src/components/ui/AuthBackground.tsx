"use client";

export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: "#FAF8F4" }}>
      {/* Large orange glow top-right */}
      <div className="absolute" style={{ top: "-80px", right: "-60px", width: "420px", height: "420px", borderRadius: "50%", background: "rgba(255,107,53,0.28)", filter: "blur(80px)" }} />
      {/* Amber glow bottom-left */}
      <div className="absolute" style={{ bottom: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,182,39,0.22)", filter: "blur(70px)" }} />
      {/* Teal accent left-center */}
      <div className="absolute" style={{ top: "30%", left: "-40px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(46,196,182,0.14)", filter: "blur(50px)" }} />
      {/* Orange pill top-left */}
      <div className="absolute" style={{ top: "30px", left: "40px", width: "200px", height: "90px", borderRadius: "45px", background: "rgba(255,107,53,0.18)", filter: "blur(25px)", transform: "rotate(-12deg)" }} />
      {/* Peach blob center-right */}
      <div className="absolute" style={{ top: "45%", right: "60px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,140,66,0.16)", filter: "blur(40px)" }} />
      {/* Large orange wash bottom-right */}
      <div className="absolute" style={{ bottom: "40px", right: "20px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,107,53,0.15)", filter: "blur(60px)" }} />
      {/* Amber dot top-center */}
      <div className="absolute" style={{ top: "80px", left: "45%", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,182,39,0.14)", filter: "blur(30px)" }} />
      {/* Soft wide wash across middle */}
      <div className="absolute" style={{ top: "25%", left: "5%", width: "90%", height: "250px", borderRadius: "50%", background: "rgba(255,107,53,0.06)", filter: "blur(100px)" }} />
      {/* Small bright accent bottom-center */}
      <div className="absolute" style={{ bottom: "120px", left: "40%", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,107,53,0.20)", filter: "blur(30px)" }} />
    </div>
  );
}