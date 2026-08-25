import jwt from "jsonwebtoken";

export const PDF_REPLACE_TYP = "pdf-replace";

export type PdfReplaceMode = "delete" | "restore";

export type PdfReplaceClaims = {
  typ: typeof PDF_REPLACE_TYP;
  userId: string;
  pageId: string;
  key: string;
  size: number;
  mode: PdfReplaceMode;
  deletedPages: number[];
};

export function signPdfReplace(
  claims: Omit<PdfReplaceClaims, "typ">
): string {
  return jwt.sign(
    { ...claims, typ: PDF_REPLACE_TYP },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
}

export function verifyPdfReplace(token: string): PdfReplaceClaims {
  const claims = jwt.verify(token, process.env.JWT_SECRET!) as PdfReplaceClaims;
  if (claims.typ !== PDF_REPLACE_TYP) {
    throw new Error("Invalid pdf-replace token");
  }
  return {
    ...claims,
    mode: claims.mode === "restore" ? "restore" : "delete",
    deletedPages: Array.isArray(claims.deletedPages) ? claims.deletedPages : [],
  };
}
