"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type RowData = Record<string, string>;

interface DataTableProps {
  head: string[];
  body: string[][];
}

export const DataTable = ({ head, body }: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!columnMenuOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setColumnMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [columnMenuOpen]);

  const data = useMemo<RowData[]>(() => {
    return body.map((row) => {
      return head.reduce((acc, header, index) => {
        acc[header] = row[index] ?? "";
        return acc;
      }, {} as RowData);
    });
  }, [body, head]);

  const columns = useMemo<ColumnDef<RowData>[]>(
    () =>
      head
        .filter((header) => !hiddenColumns.has(header))
        .map((header) => ({
          accessorKey: header,
          header,
          cell: (info) => info.getValue(),
        })),
    [head, hiddenColumns]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toggleColumnVisibility = (columnName: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnName)) {
        next.delete(columnName);
      } else {
        next.add(columnName);
      }
      return next;
    });
  };

  const resetColumns = () => {
    setHiddenColumns(new Set());
  };

  const allColumnsHidden = hiddenColumns.size === head.length;

  return (
    <div className="space-y-4 text-sm text-foreground">
      <div className="flex justify-end">
        <div ref={columnMenuRef} className="relative inline-flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setColumnMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2"
          >
            Columns
            {hiddenColumns.size > 0 ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {hiddenColumns.size}
              </span>
            ) : null}
          </Button>

          {columnMenuOpen ? (
            <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border bg-popover text-popover-foreground shadow-lg">
              <div className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Column visibility
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {head.map((columnName) => {
                  const isVisible = !hiddenColumns.has(columnName);
                  return (
                    <button
                      key={columnName}
                      type="button"
                      onClick={() => toggleColumnVisibility(columnName)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border text-[0.6rem] font-bold transition",
                          isVisible
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-transparent"
                        )}
                      >
                        ✓
                      </span>
                      <span className="flex-1 truncate">{columnName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {allColumnsHidden ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-12 text-center">
          <h3 className="mb-2 text-base font-semibold">All columns hidden</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Show at least one column to view the table.
          </p>
          <Button variant="default" size="sm" onClick={resetColumns}>
            Show all columns
          </Button>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-auto rounded-xl border bg-card">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead className="sticky top-0 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => {
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "px-4 py-3 text-left font-semibold text-muted-foreground",
                          header.column.getCanSort() && "cursor-pointer"
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {isSorted ? (
                            <span className="text-xs">
                              {isSorted === "asc" ? "↓" : "↑"}
                            </span>
                          ) : null}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
