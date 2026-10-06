import { useEffect, useState } from "react";
import { useBattlePacks } from "./selection";
import { dailyReading, eveningReading, questionSets, rotate } from "./daily";
import type { Pack } from "./loader";
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
export function useEveningReading() {
  const packs = useBattlePacks();
  const key = packs.map((p) => p.id).join(",");
  const [data, setData] =
    useState<Awaited<ReturnType<typeof eveningReading>>>();
  useEffect(() => {
    let active = true;
    void eveningReading(packs)
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key]);
  return data;
}
/** Tonight's three questions for a battle; the first three until loaded. */
export function useQuestionSet(pack: Pack | undefined) {
  const [set, setSet] = useState<string[]>();
  useEffect(() => {
    if (!pack) return;
    let active = true;
    void rotate(`questions-${pack.id}`, questionSets(pack.examinationQuestions))
      .then((s) => {
        if (active) setSet(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pack?.id]);
  return set ?? pack?.examinationQuestions.slice(0, 3) ?? [];
}
