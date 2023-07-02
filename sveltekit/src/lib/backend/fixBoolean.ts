export function fixBoolean(value: any) {
	switch (value) {
		case 'true':
		case true:
		case '1':
		case 1:
			return 1;
		case 'false':
		case false:
		case '0':
		case 0:
			return 0;
		default:
			return null;
	}
}
