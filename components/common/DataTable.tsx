import React, { ReactNode } from 'react';
import EmptyState from './EmptyState';

interface Column<T> {
    header: string;
    accessor: (item: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyStateMessage?: string;
}

const DataTable = <T,>(props: DataTableProps<T>) => {
    const { columns, data, emptyStateMessage = "Gösterilecek veri yok." } = props;

    return (
        <div className="overflow-x-auto rounded-lg border border-cnk-border-light bg-cnk-panel-light">
            <table className="w-full min-w-max text-sm text-left text-cnk-txt-secondary-light">
                <thead className="text-xs text-cnk-txt-primary-light uppercase bg-cnk-bg-light">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col" className="px-6 py-3 font-semibold">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-cnk-border-light hover:bg-cnk-bg-light">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                                        {col.accessor(item)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="p-4">
                                <EmptyState message={emptyStateMessage} icon="fas fa-database" />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;