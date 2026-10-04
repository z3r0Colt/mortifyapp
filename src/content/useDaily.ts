import { useEffect, useState } from "react";
import { useBattlePacks } from "./selection";
import { dailyReading } from "./daily";
export function useDailyReading() {
  const packs = useBattlePacks();
  const key = packs.map((p) => p.id).join(",");
  const [data, setData] = useState<Awaited<ReturnType<typeof dailyReading>>>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void dailyReading(packs)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load reading.");
      });
    return () => {
      active = false;
    };
  }, [key]);
  return { data, error };
}
