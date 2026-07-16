export default function CategoryChips({ categories }: { categories: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {categories.map((c) => (
        <span
          key={c}
          className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary"
        >
          {c}
        </span>
      ))}
    </span>
  );
}
