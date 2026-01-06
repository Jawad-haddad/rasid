import { useState } from "react";
import { supabase } from "../supabase";
import { Shield, Plus, Loader2 } from "lucide-react";

export default function WhitelistForm({ onInserted }) {
  const [mac, setMac] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const normMac = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

  const MAC_REGEX = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanMAC = normMac(mac);

    if (!cleanMAC) {
      setError("❌ Enter a MAC address.");
      return;
    }

    if (!MAC_REGEX.test(cleanMAC)) {
      setError("❌ Invalid MAC format. Use AA:BB:CC:DD:EE:FF");
      return;
    }

    setLoading(true);

    try {
      const { data: dupeMac, error: dupeMacErr } = await supabase
        .from("whitelist")
        .select("id")
        .eq("mac", cleanMAC)
        .limit(1);

      if (dupeMacErr) throw dupeMacErr;

      if (dupeMac && dupeMac.length > 0) {
        setError("❌ This MAC address is already whitelisted.");
        return;
      }

      const { error: insertErr } = await supabase
        .from("whitelist")
        .insert({ mac: cleanMAC });

      if (insertErr) throw insertErr;

      setSuccess("✔ Device successfully whitelisted!");
      setMac("");
      onInserted && onInserted();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to insert entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whitelist-card">
      <div className="whitelist-header">
        <div className="whitelist-icon-circle">
          <Shield className="whitelist-icon" />
        </div>
        <div>
          <h2 className="whitelist-title">Whitelist device</h2>
          <p className="whitelist-subtitle">Add trusted devices by MAC</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="whitelist-form">
        <div className="whitelist-field">
          <label className="whitelist-label">Device MAC</label>
          <input
            className="whitelist-input"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="whitelist-button">
          {loading ? (
            <>
              <Loader2 className="whitelist-button-icon spinning" />
              Checking...
            </>
          ) : (
            <>
              <Plus className="whitelist-button-icon" />
              Add to whitelist
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="whitelist-message whitelist-error">{error}</div>
      )}
      {success && (
        <div className="whitelist-message whitelist-success">{success}</div>
      )}
    </div>
  );
}
