import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";
import { GameTableSkeleton } from "./components/GameTableSkeleton";
import { useNavigate } from "react-router";
import { getArchiveGameRoute } from "@/constants/routes";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enablePagination?: boolean;
  pageSize?: number;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enablePagination = false,
  pageSize = 1,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const navigate = useNavigate();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // Column headers over "No games yet" are noise
  const isEmpty = !isLoading && data.length === 0;

  return (
    <div>
      <Table>
        {!isEmpty && (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-9 px-4 text-xs font-normal text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody>
          {isLoading ? (
            <GameTableSkeleton rows={pageSize} columnCount={columns.length} />
          ) : data.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const gameId = (row.original as { id?: number }).id;
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  // The whole row is clickable with a mouse; keyboard and
                  // screen reader users get a real link in the Players cell
                  // (see Columns), so the row itself isn't focusable
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) return;
                    if (gameId) navigate(getArchiveGameRoute(String(gameId)));
                  }}
                  className="cursor-pointer focus-within:bg-accent/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                {emptyState ?? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No games yet.
                  </p>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {enablePagination && (
        <div className="border-t border-border py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
          />
        </div>
      )}
    </div>
  );
}
