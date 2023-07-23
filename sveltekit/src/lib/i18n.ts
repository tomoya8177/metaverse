import languageData from '$lib/locales';
import { cookies } from './frontend/cookies';
class I18N {
	locale: string = 'en';
	data: any = {};
	constructor() {
		//get cookie
		const cookie = document.cookie;

		const cookieLocale = cookies.get('locale');
		if (cookieLocale && cookieLocale != 'undefined') {
			this.locale = cookies.get('locale');
		} else {
			//get browser language
			const browserLanguage = navigator.language;
			if (browserLanguage) {
				this.locale = browserLanguage;
			}
		}
		this.load();
	}
	load() {
		this.data = languageData[this.locale];
		//save cookie
		cookies.set('locale', this.locale, { expires: 365 });
	}
	async setLocale(locale: string) {
		this.locale = locale;
		this.load();
	}
	t(key: string) {
		//await this.load(this.locale);
		let value = this.data;
		if (!value) return key;
		value = value[key] || '';
		return value || key;
	}
}
export const lang = new I18N();

export const _ = (key: string) => lang.t(key);
