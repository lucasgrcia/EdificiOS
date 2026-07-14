type SectionTitleProps = {
  children: string;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
      {children}
    </h2>
  );
}
