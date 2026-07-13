import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

export default function useResolvedMode(appearanceMode) {
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false
  );

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (appearanceMode === "light" || appearanceMode === "dark") {
    return appearanceMode;
  }
  return systemDark ? "dark" : "light";
}
