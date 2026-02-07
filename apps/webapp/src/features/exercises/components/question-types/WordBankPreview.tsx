interface WordBankPreviewProps {
  questionIndex: number;
  options: {
    wordBank: string[];
    summaryText: string;
  } | null;
}

export function WordBankPreview({
  questionIndex,
  options,
}: WordBankPreviewProps) {
  const summaryText = options?.summaryText ?? "";

  // Split text by ___N___ blanks and interleave with blank indicators
  const parts = summaryText.split(/___(\d+)___/);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{questionIndex + 1}.</p>
      <div className="pl-4 text-sm leading-relaxed">
        {parts.map((part, idx) => {
          // Even indices are text, odd indices are blank numbers
          if (idx % 2 === 0) {
            return <span key={idx}>{part}</span>;
          }
          return (
            <span
              key={idx}
              className="inline-flex items-end justify-center min-w-[6rem] mx-1 pb-0.5 border-b-2 border-foreground/40"
            >
              <span className="text-[10px] text-muted-foreground/60">{part}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
