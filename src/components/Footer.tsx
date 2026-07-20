interface FooterProps {
  note?: string;
  siteName: string;
}

export function Footer({ note, siteName }: FooterProps) {
  return (
    <footer className="mt-14 border-t border-paper-300 pt-6">
      {note && (
        <p className="mb-3 max-w-[40rem] text-[0.85rem] leading-[1.55] text-ink-faint">
          {note}
        </p>
      )}
      <p className="text-[0.8125rem] leading-[1.5] text-ink-faint">
        &copy; 2026 {siteName}
      </p>
    </footer>
  );
}
