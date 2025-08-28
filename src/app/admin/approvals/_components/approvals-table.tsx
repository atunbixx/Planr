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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApprovalQueue, ApprovalType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { DecisionDialog } from './decision-dialog';

// --- Dialog State ---
type DialogState = {
  approve: boolean;
  item: ApprovalQueue | null;
}

export function ApprovalsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- State Management ---
  const [data, setData] = React.useState<ApprovalQueue[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogState, setDialogState] = React.useState<DialogState>({ approve: true, item: null });

  // Read state from URL
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';
  const status = searchParams.get('status') ?? '';
  const targetType = searchParams.get('targetType') ?? '';

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(limit),
  });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  // --- Columns Definition ---
  const columns: ColumnDef<ApprovalQueue>[] = [
    { accessorKey: 'targetType', header: 'Type' },
    { accessorKey: 'targetId', header: 'Target ID' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === 'PENDING' ? 'default' : status === 'APPROVED' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status}</Badge>
      }
    },
    { accessorKey: 'submittedBy', header: 'Submitted By' },
    {
      accessorKey: 'createdAt',
      header: 'Submitted At',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        if (item.status !== 'PENDING') return null;

        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setDialogState({ approve: true, item })}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => setDialogState({ approve: false, item })}>Reject</Button>
          </div>
        );
      },
    },
  ];

  const refetchData = () => {
    const params = new URLSearchParams(searchParams.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  // --- Data Fetching ---
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(pageIndex + 1));
      params.set('limit', String(pageSize));

      try {
        const res = await fetch(`/api/admin/approvals?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        const json = await res.json();
        setData(json.items || []);
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
        <Select value={status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={targetType} onValueChange={(value) => handleFilterChange('targetType', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {Object.values(ApprovalType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
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

      <DecisionDialog
        isOpen={dialogState.item !== null}
        onClose={() => setDialogState({ approve: true, item: null })}
        item={dialogState.item}
        approve={dialogState.approve}
        onSuccess={refetchData}
      />
    </div>
  );
}
