import { Check, Loader2 } from "lucide-react";

type SubscribePremiumCardProps = {
  name: string;
  tagline: string;
  priceLabel: string;
  periodLabel: string;
  note: string;
  badge?: string;
  features: readonly string[];
  buttonLabel: string;
  paying: boolean;
  disabled: boolean;
  onSubscribe: () => void;
};

export function SubscribePremiumCard({
  name,
  tagline,
  priceLabel,
  periodLabel,
  note,
  badge,
  features,
  buttonLabel,
  paying,
  disabled,
  onSubscribe,
}: SubscribePremiumCardProps) {
  return (
    <div className="p-6 rounded-xl border border-[var(--accent)] bg-[var(--bg-secondary)] flex flex-col relative overflow-hidden h-full">
      {badge ? (
        <div className="absolute top-0 right-0 px-3 py-1 text-[11px] font-medium bg-[var(--accent)] text-white rounded-bl-lg">
          {badge}
        </div>
      ) : null}
      <p className="text-sm font-medium text-[var(--accent)] mb-1">{name}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">{tagline}</p>
      <div className="mb-3">
        <span className="text-3xl font-bold">{priceLabel}</span>
        <span className="text-[var(--text-muted)] text-sm ml-1">/ {periodLabel}</span>
        <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">{note}</p>
      </div>
      <ul className="space-y-2 mb-5 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={disabled}
        className="btn-primary w-full justify-center disabled:opacity-50"
      >
        {paying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  );
}
