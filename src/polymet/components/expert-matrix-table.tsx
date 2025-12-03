import React, { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  GripVerticalIcon,
} from "lucide-react";
import { advancedTheme } from "@/polymet/data/theme-tokens";

export interface MatrixColumn<T = any> {
  /**
   * Column ID
   */
  id: string;
  /**
   * Column header label
   */
  label: string;
  /**
   * Accessor function or key
   */
  accessor: keyof T | ((row: T) => any);
  /**
   * Cell renderer
   */
  cell?: (value: any, row: T) => React.ReactNode;
  /**
   * Initial width in pixels
   */
  width?: number;
  /**
   * Minimum width in pixels
   */
  minWidth?: number;
  /**
   * Is sortable
   */
  sortable?: boolean;
  /**
   * Alignment
   */
  align?: "left" | "center" | "right";
  /**
   * Show parameter ID in expert mode
   */
  parameterId?: string;
}

export interface ExpertMatrixTableProps<T = any> {
  /**
   * Column definitions
   */
  columns: MatrixColumn<T>[];
  /**
   * Table data
   */
  data: T[];
  /**
   * Show expert mode (parameter IDs)
   */
  expertMode?: boolean;
  /**
   * Enable column resizing
   */
  resizable?: boolean;
  /**
   * Enable sorting
   */
  sortable?: boolean;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Callback when row is clicked
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Callback when sort changes
   */
  onSortChange?: (columnId: string, direction: "asc" | "desc" | null) => void;
}

type SortState = {
  columnId: string | null;
  direction: "asc" | "desc" | null;
};

/**
 * Expert matrix table with sortable and resizable columns
 * Compact typography from advanced theme tokens
 */
export function ExpertMatrixTable<T = any>({
  columns,
  data,
  expertMode = false,
  resizable = true,
  sortable = true,
  className = "",
  onRowClick,
  onSortChange,
}: ExpertMatrixTableProps<T>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    columns.reduce(
      (acc, col) => ({
        ...acc,
        [col.id]: col.width || 150,
      }),
      {}
    )
  );
  const [sortState, setSortState] = useState<SortState>({
    columnId: null,
    direction: null,
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Handle column resize
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    setResizingColumn(columnId);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnId];
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return;

      const delta = e.clientX - resizeStartX.current;
      const column = columns.find((c) => c.id === resizingColumn);
      const minWidth = column?.minWidth || 80;
      const newWidth = Math.max(minWidth, resizeStartWidth.current + delta);

      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingColumn, columns]);

  // Handle sort
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const column = columns.find((c) => c.id === columnId);
    if (!column?.sortable) return;

    let newDirection: "asc" | "desc" | null = "asc";
    if (sortState.columnId === columnId) {
      if (sortState.direction === "asc") {
        newDirection = "desc";
      } else if (sortState.direction === "desc") {
        newDirection = null;
      }
    }

    setSortState({
      columnId: newDirection ? columnId : null,
      direction: newDirection,
    });
    onSortChange?.(columnId, newDirection);
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortState.columnId || !sortState.direction) return data;

    const column = columns.find((c) => c.id === sortState.columnId);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue =
        typeof column.accessor === "function"
          ? column.accessor(a)
          : a[column.accessor];
      const bValue =
        typeof column.accessor === "function"
          ? column.accessor(b)
          : b[column.accessor];

      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortState, columns]);

  // Get cell value
  const getCellValue = (row: T, column: MatrixColumn<T>) => {
    return typeof column.accessor === "function"
      ? column.accessor(row)
      : row[column.accessor];
  };

  // Get sort icon
  const getSortIcon = (columnId: string) => {
    if (sortState.columnId !== columnId) {
      return <ArrowUpDownIcon className="w-3 h-3 text-muted-foreground" />;
    }
    return sortState.direction === "asc" ? (
      <ArrowUpIcon className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDownIcon className="w-3 h-3 text-primary" />
    );
  };

  return (
    <div
      className={`relative overflow-auto ${className}`}
      style={{
        fontSize: advancedTheme.typography.fontSize.sm,
        lineHeight: advancedTheme.typography.lineHeight.tight,
      }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className="relative group"
                style={{
                  width: columnWidths[column.id],
                  minWidth: column.minWidth || 80,
                  textAlign: column.align || "left",
                  padding: `${advancedTheme.spacing.sm} ${advancedTheme.spacing.md}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Sort button */}
                  {column.sortable && sortable && (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="hover:text-foreground transition-colors"
                    >
                      {getSortIcon(column.id)}
                    </button>
                  )}

                  {/* Label */}
                  <span className="font-semibold truncate">{column.label}</span>

                  {/* Parameter ID in expert mode */}
                  {expertMode && column.parameterId && (
                    <span
                      className="text-xs text-muted-foreground font-mono"
                      style={{ fontSize: advancedTheme.typography.fontSize.xs }}
                    >
                      [{column.parameterId}]
                    </span>
                  )}
                </div>

                {/* Resize handle */}
                {resizable && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-opacity flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, column.id)}
                  >
                    <GripVerticalIcon className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={onRowClick ? "cursor-pointer hover:bg-accent/50" : ""}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column) => {
                const value = getCellValue(row, column);
                const content = column.cell ? column.cell(value, row) : value;

                return (
                  <TableCell
                    key={column.id}
                    style={{
                      width: columnWidths[column.id],
                      textAlign: column.align || "left",
                      padding: `${advancedTheme.spacing.sm} ${advancedTheme.spacing.md}`,
                    }}
                  >
                    {content}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
