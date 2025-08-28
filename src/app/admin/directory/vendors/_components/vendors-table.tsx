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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vendor, VendorStatus, VerificationStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

export function VendorsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- State Management ---
  const [data, setData] = React.useState<Vendor[]>([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Read state from URL
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const verification = searchParams.get('verification') ?? '';
  const category = searchParams.get('category') ?? '';


  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(limit),
  });

  const pagination = React.useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize]
  );

  // --- Columns Definition ---
  const columns: ColumnDef<Vendor>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'category', header: 'Category' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>
    },
    {
      accessorKey: 'verification',
      header: 'Verification',
      cell: ({ row }) => <Badge variant="secondary">{row.original.verification}</Badge>
    },
    { accessorKey: 'score', header: 'Score' },
    {
      id: 'actions',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/directory/vendors/${vendor.id}`)}>
            View
          </Button>
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
        const res = await fetch(`/api/admin/vendors?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
        const json = await res.json();
        setData(json.vendors || []);
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
      <div className="flex items-center gap-4 flex-wrap">
        <Input placeholder="Search..." defaultValue={q} onChange={(e) => handleFilterChange('q', e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.values(VendorStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={verification} onValueChange={(value) => handleFilterChange('verification', value)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by Verification" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {Object.values(VerificationStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* TODO: Add category filter */}
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
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(`/admin/directory/vendors/${row.original.id}`)}>
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
