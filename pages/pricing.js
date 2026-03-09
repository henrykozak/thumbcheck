export default function Pricing() {
  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",color:"#F2F2F2"}}>
      <div style={{textAlign:"center",maxWidth:440,padding:40}}>
        <h1 style={{fontSize:64,marginBottom:16}}>GO PRO</h1>
        <p style={{color:"#555",marginBottom:32}}>Unlimited analyses, full breakdowns, improvement tips.</p>
        <div style={{background:"#130606",border:"2px solid #FF2D2D",borderRadius:16,padding:40,marginBottom:24}}>
          <div style={{fontSize:80,color:"#FF2D2D",fontWeight:700}}>$9</div>
          <div style={{color:"#555",marginBottom:32}}>per month · cancel anytime</div>
          <button onClick={handleUpgrade} style={{width:"100%",background:"#FF2D2D",color:"white",border:"none",borderRadius:8,padding:18,fontSize:16,fontWeight:600,cursor:"pointer"}}>
            Upgrade Now
          </button>
        </div>
        <p style={{color:"#555",fontSize:13}}>Secure payment via Stripe. Cancel anytime.</p>
      </div>
    </div>
  );
}
