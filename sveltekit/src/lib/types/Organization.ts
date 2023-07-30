export type Organization = {
	id: string;
	title: string;
	checked?: boolean;
	isManager?: boolean;
	slug: string;
	allowRegistration: boolean;
	thumbnailURL: string;
};
