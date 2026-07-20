interface BioProps {
  greeting: string;
  bio: string;
  location: string;
}

export function Bio({ greeting, bio, location }: BioProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-serif text-[2.125rem] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[2.5rem]">
        {greeting}
      </h1>
      <p className="max-w-[40rem] text-[1.0625rem] leading-[1.65] text-ink-soft">
        {bio}
      </p>
      <p className="text-[0.95rem] leading-[1.5] text-ink-muted">
        {location}
      </p>
    </section>
  );
}
