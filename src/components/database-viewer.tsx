"use client";

import { useEffect, useState } from "react";
import { DATABASE_TABLE_NAMES, type DatabaseTableName } from "~/data/database/tables";

type DatabaseRow = Record<string, unknown>;

type DatabaseResponse = {
  rows: DatabaseRow[];
  columns: string[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

export function DatabaseViewer() {
  const [data, setData] = useState<Record<DatabaseTableName, DatabaseResponse | null>>({
    organisations: null,
    users: null,
    products: null,
    orders: null,
    reviews: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllTables = async () => {
      setLoading(true);
      const results = await Promise.all(
        DATABASE_TABLE_NAMES.map(async (table) => {
          try {
            const params = new URLSearchParams({
              table,
              page: "1",
              pageSize: "5",
            });

            const response = await fetch(`/api/database?${params.toString()}`);
            if (!response.ok) {
              throw new Error("Failed to fetch table data");
            }

            const result: DatabaseResponse = await response.json();
            return { table, result };
          } catch (error) {
            console.error(`Failed to fetch ${table}:`, error);
            return { table, result: null };
          }
        })
      );

      const newData = results.reduce((acc, { table, result }) => {
        acc[table] = result;
        return acc;
      }, {} as Record<DatabaseTableName, DatabaseResponse | null>);

      setData(newData);
      setLoading(false);
    };

    void fetchAllTables();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading database structure...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
      {DATABASE_TABLE_NAMES.map((tableName) => {
        const tableData = data[tableName];
        if (!tableData) return null;

        return (
          <div
            key={tableName}
            className="rounded-md border border-gray-200 bg-white"
            style={{ fontSize: "11px" }}
          >
            {/* Table header */}
            <div className="border-b border-gray-200 bg-gray-50 px-2 py-1">
              <div className="font-semibold capitalize text-gray-900">
                {tableName}
              </div>
              <div className="text-gray-500">
                {tableData.totalCount} rows
              </div>
            </div>

            {/* Columns list */}
            <div className="px-2 py-1">
              {tableData.columns.map((col, idx) => {
                const sampleValue = tableData.rows[0]?.[col];
                const dataType = typeof sampleValue === "number" ? "number" :
                                typeof sampleValue === "boolean" ? "boolean" :
                                "text";

                return (
                  <div
                    key={col}
                    className="flex items-center justify-between border-b border-gray-100 py-0.5 last:border-b-0"
                  >
                    <span className="font-mono text-gray-700">{col}</span>
                    <span className="text-gray-400">{dataType}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
