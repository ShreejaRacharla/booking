import React from "react";
import { Column } from "../../types";

interface TableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  emptyMessage = "No records found",
}) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full text-sm min-w-[600px]">
      <thead>
        <tr className="bg-rotary-royal/5 border-b border-gray-200">
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-4 py-3 text-left text-xs font-bold text-rotary-royal uppercase tracking-wider whitespace-nowrap"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-10 text-center text-rotary-midgray"
            >
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <span>{emptyMessage}</span>
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
                  className="px-4 py-3 text-rotary-black whitespace-nowrap"
                >
                  {col.render
                    ? col.render(row[col.key], row, idx)
                    : row[col.key]}
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