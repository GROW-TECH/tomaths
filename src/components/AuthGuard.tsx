import { useEffect } from "react";

export default function AuthGuard({ children }: { children: JSX.Element }) {
  useEffect(() => {
    if (localStorage.getItem("admin_logged_in") !== "true") {
      window.location.href = "/login";
    }
  }, []);

  return children;
}
