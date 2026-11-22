interface TensesChartProps {
  markdown: string;
}

function parseTable(markdown: string): string[][] {
  const tableLines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (tableLines.length < 2) return [];

  const parseRow = (line: string) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = parseRow(tableLines[0]);
  const rows = tableLines
    .slice(1)
    .map(parseRow)
    .filter(
      (row) =>
        !row.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, ""))),
    );

  return [headers, ...rows];
}

function CellContent({ text }: { text: string }) {
  const parts = text.replace(/\*\*/g, "").split(/<br\s*\/?>/gi);

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

export default function TensesChart({ markdown }: TensesChartProps) {
  const table = parseTable(markdown);

  if (table.length === 0) {
    return <p className="cefr-review-empty">Не удалось загрузить карту времён.</p>;
  }

  const [headers, ...rows] = table;

  return (
    <div className="lesson-content lesson-tenses-chart">
      <div className="lesson-tenses-chart__scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cellIndex}-${rowIndex}`}>
                    {cellIndex === 0 ? (
                      <strong>
                        <CellContent text={cell} />
                      </strong>
                    ) : (
                      <CellContent text={cell} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
