import { _ } from '$lib/i18n';

export type AttendanceStatus =
	| 'attending'
	| 'notAttending'
	| 'present'
	| 'absent'
	| 'late'
	| 'excused'
	| 'leftEarly'
	| 'unknown';

export const AttendanceStatusOptions: {
	key: AttendanceStatus;
	label: string;
}[] = [
	{ key: 'present', label: _('Present') },
	{ key: 'absent', label: _('Absent') },
	{ key: 'late', label: _('Late') },
	{ key: 'excused', label: _('Excused') },
	{ key: 'leftEarly', label: _('Left Early') }
];
export const AttendanceStatusOptionsWithUnknown: {
	key: AttendanceStatus;
	label: string;
}[] = [
	{ key: 'unknown', label: _('Unknown') },
	{ key: 'attending', label: _('Attending') },
	{ key: 'notAttending', label: _('Not Attending') }
];
