import { DBObject } from '$lib/frontend/Classes/DBObject';

export class Organization extends DBObject {
	title: string;
	checked?: boolean;
	isManager?: boolean;
	slug: string;
	allowRegistration: boolean;
	thumbnailURL: string;
	constructor(data: any = {}) {
		data.table = 'organizations';
		super(data);
		this.title = this.unescapedData.title || '';
		this.checked = this.unescapedData.checked || false;
		this.isManager = this.unescapedData.isManager || false;
		this.slug = this.unescapedData.slug || '';
		this.allowRegistration = this.unescapedData.allowRegistration || false;
		this.thumbnailURL = this.unescapedData.thumbnailURL || '';
	}
}
