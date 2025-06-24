import { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import "tabulator-tables/dist/css/tabulator.min.css";
import '@styles/table.css';

function useTable({ data, columns, filter, dataToFilter, initialSortName, onSelectionChange, selectedRows = [] }) {
    const tableRef = useRef(null);
    const tabulatorRef = useRef(null);
    const listenersRef = useRef({});
    const observerRef = useRef(null);
    const [isTableReady, setIsTableReady] = useState(false);

    useEffect(() => {
        function setCheckboxesTabIndex() {
            if (!tableRef.current) return;
            const checkboxes = tableRef.current.querySelectorAll('input[type="checkbox"].tabulator-row-selection');
            checkboxes.forEach(cb => cb.tabIndex = -1);
        }

        function preventCheckboxInteraction(e) {
            if (
                e.target &&
                e.target.type === 'checkbox' &&
                e.target.classList.contains('tabulator-row-selection')
            ) {
                e.preventDefault();
                e.stopPropagation();
                e.target.blur();
            }
        }

        if (tableRef.current) {
            const updatedColumns = [
                {
                    formatter: "rowSelection",
                    titleFormatter: "rowSelection",
                    hozAlign: "center",
                    headerSort: false,
                    cellClick: function (e, cell) {
                        e.preventDefault();
                        e.stopPropagation();
                        cell.getRow().toggleSelect();
                        return false;
                    }
                },
                ...columns
            ];

            tabulatorRef.current = new Tabulator(tableRef.current, {
                data: [],
                columns: updatedColumns,
                layout: "fitColumns",
                responsiveLayout: "collapse",
                pagination: true,
                paginationSize: 6,
                selectableRows: true,
                rowHeight: 46,
                index: 'rut',
                langs: {
                    "default": {
                        "pagination": {
                            "first": "Primero",
                            "prev": "Anterior",
                            "next": "Siguiente",
                            "last": "Último",
                        }
                    }
                },
                initialSort: [
                    { column: initialSortName, dir: "asc" }
                ],
            });

            tabulatorRef.current.on("rowSelectionChanged", function (selectedData) {
                if (onSelectionChange) {
                    onSelectionChange(selectedData);
                }
            });

            tabulatorRef.current.on("tableBuilt", function () {
                setIsTableReady(prev => {
                    if (!prev) {
                        return true;
                    }
                    return prev;
                });

                const container = tableRef.current;
                if (container) {
                    container.addEventListener('click', preventCheckboxInteraction, true);
                    container.addEventListener('mousedown', preventCheckboxInteraction, true);
                    container.addEventListener('focusin', preventCheckboxInteraction, true);
                    setCheckboxesTabIndex();

                    observerRef.current = new MutationObserver(setCheckboxesTabIndex);
                    observerRef.current.observe(container, { childList: true, subtree: true });

                    listenersRef.current = { preventCheckboxInteraction };
                }
            });
        }

        return () => {
            setIsTableReady(false);
            if (tabulatorRef.current) {
                tabulatorRef.current.destroy();
                tabulatorRef.current = null;
            }

            const container = tableRef.current;
            if (container && listenersRef.current.preventCheckboxInteraction) {
                container.removeEventListener('click', listenersRef.current.preventCheckboxInteraction, true);
                container.removeEventListener('mousedown', listenersRef.current.preventCheckboxInteraction, true);
                container.removeEventListener('focusin', listenersRef.current.preventCheckboxInteraction, true);
            }

            if (observerRef.current) observerRef.current.disconnect();
        };
    }, []); // solo se ejecuta una vez al montar

    useEffect(() => {
        if (tabulatorRef.current && isTableReady) {
            tabulatorRef.current.replaceData(data);
        }
    }, [data, isTableReady]);

    useEffect(() => {
        if (tabulatorRef.current && isTableReady) {
            if (filter) {
                tabulatorRef.current.setFilter(dataToFilter, "like", filter);
            } else {
                tabulatorRef.current.clearFilter();
            }
            tabulatorRef.current.redraw();
        }
    }, [filter, dataToFilter, isTableReady]);

    useEffect(() => {
        if (tabulatorRef.current && isTableReady) {
            if (selectedRows && selectedRows.length > 0) {
                tabulatorRef.current.selectRow(selectedRows.map(u => u.rut));
            } else {
                tabulatorRef.current.deselectRow();
            }
        }
    }, [selectedRows, isTableReady]);

    return { tableRef };
}

export default useTable;
