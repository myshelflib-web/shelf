"use client";

import { SignupTermsAccept } from "@/components/legal/SignupTermsAccept";
import { TermsAcceptTooltip } from "@/components/legal/TermsAcceptGate";

export function SignupTermsWithHint({
  checked,
  onChange,
  hintOpen,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  hintOpen: boolean;
}) {
  return (
    <TermsAcceptTooltip open={hintOpen} side="bottom">
      <SignupTermsAccept checked={checked} onChange={onChange} />
    </TermsAcceptTooltip>
  );
}
