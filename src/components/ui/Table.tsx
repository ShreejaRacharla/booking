import React from "react";
import { Archive } from "lucide-react";
import { Column } from "../../types";

interface TableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  emptyMessage = "No records found",
  emptyIcon: EmptyIcon = Archive,
}) => (
  <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
    <table className="w-full text-sm min-w-[600px]">
      <thead>
        <tr className="bg-rotary-royal/5 border-b border-gray-200">
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs font-bold text-rotary-royal uppercase tracking-wider whitespace-nowrap"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 sm:py-10 text-center text-rotary-midgray"
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <EmptyIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" strokeWidth={1.5} />
                <span className="text-sm sm:text-base">{emptyMessage}</span>
              </div>
            </td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="hover:bg-rotary-lightgray/80 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-rotary-black text-xs sm:text-sm whitespace-nowrap"
                >
                  {col.render
                    ? col.render(row[col.key], row, idx)
                    : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Table;