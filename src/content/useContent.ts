import { useEffect, useState } from "react";
export function useContent<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load content.");
      });
    return () => {
      active = false;
    };
  }, [loader]);
  return { data, error };
}
