/**
 * Single React entry: emergency dialog + toast host share one runtime.
 * Mounts on [data-island] nodes. Never enqueued in wp-admin or the editor.
 */
import { useEffect } from 'react';
import type { JSX } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from '@base-ui/react/dialog';
import { Toast } from '@base-ui/react/toast';
import './islands.css';
import {
	IconAlarm,
	IconAlertTriangle,
	IconPhone,
	IconX,
} from '@tabler/icons-react';

type IslandName = 'emergency-dialog' | 'toasts';

function EmergencyDialog(): JSX.Element {
	return (
		<Dialog.Root>
			<Dialog.Trigger className="wp-element-button snoka-trigger">
				<IconAlarm size={18} aria-hidden="true" /> Emergency call
				options
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="snoka-backdrop" />
				<Dialog.Popup
					className="snoka-popup"
					aria-labelledby="snoka-emergency-title"
				>
					<Dialog.Title id="snoka-emergency-title">
						Emergency contacts
					</Dialog.Title>
					<p>
						<IconAlertTriangle size={18} aria-hidden="true" /> Fire
						/ medical / crime: call 911 first.
					</p>
					<p>
						<a href="tel:+15550100000">
							<IconPhone size={18} aria-hidden="true" /> Building
							emergency: (555) 010-0000
						</a>
					</p>
					<p>
						<a href="tel:+15550100001">
							<IconPhone size={18} aria-hidden="true" />{' '}
							After-hours: (555) 010-0001
						</a>
					</p>
					<Dialog.Close
						className="snoka-popup-close"
						aria-label="Close dialog"
					>
						<IconX size={18} aria-hidden="true" />
					</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

function ToastManagerView(): JSX.Element {
	const manager = Toast.useToastManager();

	useEffect(() => {
		const onToast = (event: Event) => {
			manager.add({
				description: (event as CustomEvent<string>).detail,
				timeout: 4000,
			});
		};
		document.addEventListener('snoka:toast', onToast);
		return () => document.removeEventListener('snoka:toast', onToast);
	}, [manager]);

	return (
		<>
			{manager.toasts.map((toast) => (
				<Toast.Root
					key={toast.id}
					toast={toast}
					className="snoka-toast"
				>
					<Toast.Content>
						<Toast.Description />
						<Toast.Close aria-label="Dismiss" />
					</Toast.Content>
				</Toast.Root>
			))}
		</>
	);
}

function ToastHost(): JSX.Element {
	return (
		<Toast.Provider>
			<ToastManagerView />
			<Toast.Viewport className="snoka-toasts" />
		</Toast.Provider>
	);
}

const ISLANDS: Record<IslandName, () => JSX.Element> = {
	'emergency-dialog': EmergencyDialog,
	toasts: ToastHost,
};

function mountIslands(): void {
	document.querySelectorAll<HTMLElement>('[data-island]').forEach((node) => {
		const name = node.getAttribute('data-island') as IslandName | null;
		if (!name || !(name in ISLANDS)) {
			return;
		}
		const Component = ISLANDS[name];
		createRoot(node).render(<Component />);
	});
}

mountIslands();
