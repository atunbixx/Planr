'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditLog } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function LogsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- State Management ---
  const [data, setData] = React.useState<AuditLog[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Read state from URL
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '50';
  const q = searchParams.get('action') ?? '';
  const actorId = searchParams.get('actorId') ?? '';
  const targetId = searchParams.get('targetId') ?? '';


  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(limit),
  });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  // --- Columns Definition ---
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
    },
    { accessorKey: 'actorId', header: 'Actor ID' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'targetId', header: 'Target ID' },
    {
      id: 'details',
      cell: ({ row }) => {
        const log = row.original;
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">View Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Metadata</DialogTitle>
              </DialogHeader>
              <pre className="mt-2 w-full rounded-md bg-secondary p-4 text-sm overflow-x-auto">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            </DialogContent>
          </Dialog>
        );
      },
    },
  ];

  // --- Data Fetching ---
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(pageIndex + 1));
      params.set('limit', String(pageSize));

      try {
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        const json = await res.json();
        setData(json.logs || []);
        setPageCount(Math.ceil(json.total / pageSize));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pageIndex, pageSize, searchParams]);

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  // --- Event Handlers ---
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  // --- Rendering ---
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input placeholder="Search by Action..." defaultValue={q} onChange={(e) => handleFilterChange('action', e.target.value)} className="max-w-xs" />
        <Input placeholder="Filter by Actor ID..." defaultValue={actorId} onChange={(e) => handleFilterChange('actorId', e.target.value)} className="max-w-xs" />
        <Input placeholder="Filter by Target ID..." defaultValue={targetId} onChange={(e) => handleFilterChange('targetId', e.target.value)} className="max-w-xs" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </div>
    </div>
  );
}
