import { Request } from "express";

/** Coerce Express route param to string (Express 5 types allow string | string[]). */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
