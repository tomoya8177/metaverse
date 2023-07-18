import languageData from '$lib/locales';
class I18N {
	locale: string = 'en';
	data: any = {};
	constructor() {
		//get cookie
		const cookie = document.cookie;
		const cookieLocale = cookie.split(';').find((c) => c.includes('locale'));
		if (cookieLocale) {
			this.locale = cookieLocale.split('=')[1];
		} else {
			//get browser language
			const browserLanguage = navigator.language;
			if (browserLanguage) {
				this.locale = browserLanguage;
			}
			console.log({ browserLanguage });
		}
		this.load();
	}
	load() {
		this.data = languageData[this.locale];
		//save cookie
		console.log({ data: this.data });
		document.cookie = `locale=${this.locale};path=/;max-age=31536000`;
	}
	async setLocale(locale: string) {
		this.locale = locale;
		this.load();
	}
	t(key: string) {
		//await this.load(this.locale);
		console.log({ key, data: this.data });
		const keys = key.split('.');
		let value = this.data;
		if (!value) return key;
		for (const k of keys) {
			value = value[k] || '';
		}
		console.log({ value });
		return value || key;
	}
}
export const lang = new I18N();

export const _ = (key: string) => lang.t(key);
