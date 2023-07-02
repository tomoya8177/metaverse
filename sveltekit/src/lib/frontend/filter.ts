export const filter = (array: any[], keyword: string) => {
	return array.filter((item) => {
		let value = JSON.stringify(item);
		return value?.toString().toUpperCase().includes(keyword.toUpperCase());
	});
};
