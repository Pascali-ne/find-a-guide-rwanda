import { z } from "zod";
import { HttpError } from "./errors";

/** Parses input with a zod schema and throws a 400 with field-level messages. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    throw new HttpError(400, Object.values(fields)[0] ?? "Invalid input.", fields);
  }
  return result.data;
}

export const dateString = (msg = "Please select a valid date.") =>
  z.string({ error: msg }).regex(/^\d{4}-\d{2}-\d{2}$/, msg);
