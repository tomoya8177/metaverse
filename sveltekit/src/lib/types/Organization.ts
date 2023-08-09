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
		this.title = data.unescapedData.title || '';
		this.checked = data.unescapedData.checked || false;
		this.isManager = data.unescapedData.isManager || false;
		this.slug = data.unescapedData.slug || '';
		this.allowRegistration = data.unescapedData.allowRegistration || false;
		this.thumbnailURL = data.unescapedData.thumbnailURL || '';
	}
}
