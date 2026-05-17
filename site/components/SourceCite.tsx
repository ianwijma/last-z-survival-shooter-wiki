import Link from "next/link";

interface SourceCiteProps {
  id: string;
  timestamp?: string;
  children?: React.ReactNode;
}

export function SourceCite({ id, timestamp, children }: SourceCiteProps) {
  const [sourceType, sourceId] = id.includes("/") ? id.split("/") : ["unknown", id];
  const label = children ?? sourceId;

  return (
    <sup className="source-cite">
      <Link
        href={`/sources#${id}`}
        title={`Source: ${id}${timestamp ? ` at ${timestamp}` : ""}`}
        className="source-cite-link"
      >
        [{label}]
      </Link>
    </sup>
  );
}
