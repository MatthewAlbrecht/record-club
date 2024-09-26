import type { RowData } from "@tanstack/react-table"
declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		currentMember?: SelectClubMember
		clubId?: number
	}

	interface ColumnMeta<TData extends RowData, TValue> {
		tableHeadClassName?: string
	}
}
