/**
 * Query builder — recursive AND/OR rule editor.
 *
 * Exercises the `queryBuilder` panel: arbitrary nested groups + rules,
 * operator selectors per group, add-rule / add-group / delete actions.
 */

import { BodyKind, DimmerMode, Horizontal, PanelKind, Vertical, defineMenu } from '@fancy-menus/core';

interface Rule {
	id: string;
	field: string;
	op: string;
	value: string;
}

interface Group {
	id: string;
	operator: 'and' | 'or';
	children: Array<{ kind: 'rule'; data: Rule } | { kind: 'group'; data: Group }>;
}

const SAMPLE_ROOT: Group = {
	id: 'root',
	operator: 'and',
	children: [
		{ kind: 'rule', data: { id: 'r1', field: 'status', op: 'is', value: 'open' } },
		{
			kind: 'group',
			data: {
				id: 'g1',
				operator: 'or',
				children: [
					{ kind: 'rule', data: { id: 'r2', field: 'priority', op: '>=', value: '3' } },
					{ kind: 'rule', data: { id: 'r3', field: 'tag', op: 'contains', value: 'blocker' } },
				],
			},
		},
	],
};

interface QueryBuilderData {
	initial?: Group;
	onChange: (root: Group) => void;
}

export const queryBuilder = defineMenu<QueryBuilderData, Group>({
	id: 'queryBuilder',
	description: 'Recursive AND/OR query builder with nested groups.',
	position: { width: 480, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: { title: 'Filter', dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.Composed,
		sections: [
			{
				id: 'builder',
				kind: PanelKind.QueryBuilder,
				root: SAMPLE_ROOT,
				operatorOptions: [
					{ id: 'and', label: 'All of' },
					{ id: 'or', label: 'Any of' },
				],
				getChildren: (g: Group) => g.children,
				getOperator: (g: Group) => g.operator,
				renderRule: (r: Rule) => (
					<div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-sm">
						<span className="font-medium">{r.field}</span>
						<span className="text-muted-foreground">{r.op}</span>
						<span>{r.value}</span>
					</div>
				),
				onOperatorChange: () => {},
				onAddRule: () => {},
				onAddGroup: () => {},
				onDeleteNode: () => {},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true } },
});
