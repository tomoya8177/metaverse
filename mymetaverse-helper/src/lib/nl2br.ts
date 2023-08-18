export const nl2br = (str: string) => {
	if (!str) return '';
	return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
};
