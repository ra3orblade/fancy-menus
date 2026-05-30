import { MenuProvider } from '@react-fancy-menus/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { additionalRegistrations, exampleIds, examples } from './menus';
import './styles/globals.css';
import '@react-fancy-menus/core/runtime/runtime.css';

const menus = [...exampleIds.map((id) => examples[id]!.config), ...additionalRegistrations];

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MenuProvider menus={menus}>
			<App />
		</MenuProvider>
	</StrictMode>
);
