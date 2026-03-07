import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_LINK;

export default function Settings() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("admin_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API}/admin_update.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("admin_email", email);
        setMessage("Settings updated successfully");
        setPassword("");
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch (err) {
      setMessage("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">Admin Settings</h2>

      <form onSubmit={handleUpdate} className="space-y-4">

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Admin Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            type="password"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          {loading ? "Updating..." : "Update Settings"}
        </button>

        {message && (
          <p className="text-sm text-center mt-2">{message}</p>
        )}
      </form>
    </div>
  );
}