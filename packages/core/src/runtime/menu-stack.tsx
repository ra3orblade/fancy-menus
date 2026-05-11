import { MenuView } from './menu';
import { useMenuStack } from './provider';

/** Renders every open menu in the stack. */
export function MenuStack() {
	const stack = useMenuStack();
	return (
		<>
			{stack.map((m) => (
				<MenuView key={m.id} open={m} />
			))}
		</>
	);
}
