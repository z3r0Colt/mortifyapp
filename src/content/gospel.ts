import { z } from "zod";
import { loadJson } from "./loader";
export const gospelSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  pathText: z.string().min(1),
});
export const loadGospel = () => loadJson("gospel.json", gospelSchema);
