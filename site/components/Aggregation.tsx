import Link from "next/link";

interface AggregationProps {
  id: string;
  query: Record<string, string | number | boolean | Array<string | number>>;
  render?: "list" | "grid" | "table";
  sort?: string;
  limit?: number;
  empty?: string;
  title?: string;
}

export function Aggregation({
  id,
  query,
  render = "list",
  sort = "title",
  limit,
  empty = "No matching pages.",
  title,
}: AggregationProps) {
  return (
    <div className="aggregation" data-aggregation-id={id}>
      {title && <h3>{title}</h3>}
      <p className="aggregation-placeholder">
        <em>
          Aggregation query: {JSON.stringify(query)} — Resolved at build time.
          Requires <code>allPages</code> from <code>@/lib/content</code>.
        </em>
      </p>
      <p>{empty}</p>
    </div>
  );
}
