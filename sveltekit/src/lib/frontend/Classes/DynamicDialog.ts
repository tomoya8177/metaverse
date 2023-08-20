export class DynamicDialog {
	dialog: HTMLElement;
	constructor({
		closeButton,
		cancelButton,
		header,
		body,
		buttons
	}: {
		closeButton: boolean;
		header?: {
			title: string;
		};
		body: string;
		cancelButton?: {
			label: string;
		};
		buttons: {
			label: string;
			onClick: (event: MouseEvent) => void;
			class?: string;
		}[];
	}) {
		this.dialog = document.createElement('dialog');
		this.dialog.setAttribute('open', 'false');
		const article = document.createElement('article');
		this.dialog.appendChild(article);
		document.body.appendChild(this.dialog);
		let close;
		if (closeButton) {
			close = document.createElement('a') as unknown as HTMLAnchorElement;
			close.href = '#';
			close.onclick = (event) => {
				this.close();
			};
			close.setAttribute('aria-label', 'Close');
			close.className = 'close';
		}
		let headerElement;
		if (header) {
			headerElement = document.createElement('header');
			const title = document.createElement('strong');
			title.innerText = header.title;
			headerElement.appendChild(title);
			article.appendChild(headerElement);
		}
		if (closeButton && close) {
			if (header && headerElement) {
				headerElement.appendChild(close);
			} else {
				article.appendChild(close);
			}
		}
		const p = document.createElement('p');
		p.innerText = body;
		article.appendChild(p);
		if (cancelButton) {
			buttons.push({
				label: cancelButton.label,
				onClick: (event) => {
					this.close();
				},
				class: 'secondary'
			});
		}
		if (buttons?.length) {
			buttons.forEach((button) => {
				const buttonElement = document.createElement('button');
				buttonElement.innerText = button.label;
				buttonElement.className = button.class || '';
				buttonElement.onclick = button.onClick;
				article.appendChild(buttonElement);
			});
		}
	}
	open() {
		this.dialog.setAttribute('open', 'true');
	}
	close() {
		this.dialog.removeAttribute('open');
	}
}
