"use client"

import {
	type ColumnDef,
	type SortingState,
	type TableMeta,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table"
import { Button } from "./button"
import { DataTablePagination } from "./data-table-pagination"

type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	withPagination?: boolean
	withSorting?: boolean
	withColumnFilters?: boolean
	meta?: TableMeta<TData>
}

export function DataTable<TData, TValue>({
	columns,
	data,
	withPagination,
	withSorting,
	meta,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([])

	const table = useReactTable<TData>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: withPagination ? getPaginationRowModel() : undefined,
		onSortingChange: withSorting ? setSorting : undefined,
		getSortedRowModel: withSorting ? getSortedRowModel() : undefined,
		meta,
		state: {
			sorting: withSorting ? sorting : undefined,
		},
	})

	return (
		<div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className={
												header.column.columnDef.meta?.tableHeadClassName
											}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			{withPagination && (
				<div className="mt-4">
					<DataTablePagination table={table} />
				</div>
			)}
		</div>
	)
}
