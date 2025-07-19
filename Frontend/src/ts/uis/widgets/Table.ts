import { HtmlUtil } from '../../utils/HtmlUtil.js';
import { BaseComponent, IComponentDom } from '../base/BaseComponent.js';

export interface ITableDom extends IComponentDom {
    root: HTMLDivElement;
    table: HTMLTableElement;
    caption: HTMLTableCaptionElement;
    thead: HTMLTableSectionElement;
    tbody: HTMLTableSectionElement;
}

export class Table<D extends ITableDom = ITableDom> extends BaseComponent<D> {
    public get title(): string {
        return this._dom.caption.textContent;
    }
    public set title(value: string) {
        this._dom.caption.textContent = value;
    }

    public get headers(): HTMLTableCellElement[] {
        return Array.from(this._dom.thead.querySelector('tr')?.querySelectorAll('th')) ?? [];
    }
    public set headers(nodes: (Node | string)[]) {
        this._dom.thead.innerHTML = '';
        const tr = document.createElement('tr');
        nodes.forEach(node => {
            const th = document.createElement('th');
            th.append(node);
            tr.append(th);
        })
        this._dom.thead.append(tr);
    }

    protected createDomRoot(): void {
        Object.assign(this._dom, HtmlUtil.createDom(`
            <div class="table-wrapper">
                <div class="arc arc-top"></div>
                <table data-enh-label="table">
                    <caption data-enh-label="caption"></caption>
                    <thead data-enh-label="thead"></thead>
                    <tbody data-enh-label="tbody"></tbody>
                </table>
                <div class="arc arc-bottom"></div>
            </div>
        `));
    }

    public addRow(...nodes: (Node | string)[]): HTMLTableRowElement {
        const tr = document.createElement('tr');
        nodes.forEach(node => {
            const th = document.createElement('td');
            th.append(node);
            tr.append(th);
        })
        this._dom.tbody.append(tr);
        return tr;
    }

    public clearRows(): void {
        this._dom.tbody.innerHTML = '';
    }

    public setColumnDisplay(column: number, display: boolean): void {
        column = +column;
        display = !display;
        if (isNaN(column)) {
            return;
        }
        this._dom.table.querySelectorAll(`th:nth-child(${column}),td:nth-child(${column})`).forEach(cell => cell.classList.toggle('hidden', display));
    }
}
