import type { AttendanceStatus } from '$lib/types/AttendanceStatus';
import { DBObject } from './DBObject';

export class Attendance extends DBObject {
	user: string;
	event: string;
	status: AttendanceStatus;
	description: string;
	stars: number;
	review: string;
	constructor(data: any) {
		data.table = 'attendances';
		super(data);
		this.user = this.unescapedData?.user || '';
		this.event = this.unescapedData?.event || '';
		this.status = this.unescapedData?.status || 'unknown';
		this.description = this.unescapedData?.description || '';
		this.stars = data.stars || 5;
		this.review = this.unescapedData?.review || '';
	}
}
