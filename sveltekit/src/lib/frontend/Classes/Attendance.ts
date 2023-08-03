import { DBObject } from './DBObject';
export type AttendanceStatus =
	| 'attending'
	| 'notAttending'
	| 'present'
	| 'absent'
	| 'late'
	| 'excused'
	| 'leftEarly'
	| 'unknown';
export class Attendance extends DBObject {
	user: string;
	event: string;
	status: AttendanceStatus;
	description: string;
	constructor(data: any) {
		data.table = 'attendances';
		super(data);
		this.user = this.unescapedData?.user || '';
		this.event = this.unescapedData?.event || '';
		this.status = this.unescapedData?.status || 'unknown';
		this.description = this.unescapedData?.description || '';
	}
}
