/**
 * Date picker — composed body with a month grid and an action footer.
 *
 * Exercises:
 *   - composed body (panel + button row)
 *   - monthGrid panel (built-in calendar primitive)
 *   - footer with Today / Clear buttons
 */

import { BodyKind, DimmerMode, Horizontal, type MenuCtx, PanelKind, Vertical, defineMenu } from '@fancy-menus/core';
import { CalendarDays } from 'lucide-react';

interface DatePickerData {
	initial?: number;
	onSelect: (timestamp: number | null) => void;
	canClear?: boolean;
	withToday?: boolean;
}

export const datePicker = defineMenu<DatePickerData, number>({
	id: 'datePicker',
	description: 'Month grid with optional Today / Clear actions.',
	position: { width: 280, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: {
		title: 'Pick a date',
		dimmer: DimmerMode.Default,
	},
	body: {
		kind: BodyKind.Composed,
		sections: [
			{
				id: 'grid',
				kind: PanelKind.MonthGrid,
				canEdit: true,
				showFooter: false,
				// Click the month or year label in the header to switch to a
				// month/year picker. Set withTime: true on the data payload
				// to also expose an HH:MM input below the calendar.
				withTime: true,
				onChange: (timestamp, ctx) => {
					ctx.data.onSelect(timestamp);
					// Don't close on every keystroke when time is being edited;
					// only close when a date cell is clicked. We approximate by
					// keeping the menu open here and letting the chrome footer's
					// Done / Today / Clear handle dismissal.
				},
				onClear: (ctx) => {
					ctx.data.onSelect(null);
					ctx.close();
				},
			},
			{
				id: 'actions',
				kind: BodyKind.Custom,
				render: (ctx: MenuCtx<DatePickerData>) => (
					<div className="flex items-center justify-between border-t border-border px-3 py-2">
						<button
							type="button"
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
							onClick={() => {
								ctx.data.onSelect(Date.now());
								ctx.close();
							}}
						>
							<CalendarDays className="size-3.5" />
							Today
						</button>
						{ctx.data.canClear && (
							<button
								type="button"
								className="text-xs text-muted-foreground hover:text-destructive"
								onClick={() => {
									ctx.data.onSelect(null);
									ctx.close();
								}}
							>
								Clear
							</button>
						)}
					</div>
				),
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true } },
});
