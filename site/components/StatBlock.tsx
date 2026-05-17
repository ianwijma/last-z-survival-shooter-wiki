interface StatBlockProps {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}

export function StatBlock({ headers, rows, caption }: StatBlockProps) {
  return (
    <figure className="stat-block">
      {caption && <figcaption>{caption}</figcaption>}
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell === "—" ? "—" : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
