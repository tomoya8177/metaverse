import html2canvas from 'html2canvas';

export class HTML2Canvas {
	async getJpegBlob(el: HTMLElement, filename: string): Promise<Blob | false> {
		try {
			const canvas = await html2canvas(el);
			const dataUrl = canvas.toDataURL(filename, 0.9);
			const blob = await fetch(dataUrl).then((res) => res.blob());
			return blob;
		} catch (err) {
			console.error(err);
			return false;
		}
	}
}
