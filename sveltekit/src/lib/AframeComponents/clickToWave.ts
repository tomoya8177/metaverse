import { Me } from '$lib/frontend/Classes/Me';
import type { User } from '$lib/frontend/Classes/User';
import { Users } from '$lib/frontend/Classes/Users';
import { toast } from '$lib/frontend/toast';
import { _ } from '$lib/i18n';
import { UserStore } from '$lib/store';
let user: User;
UserStore.subscribe((value) => {
	user = value;
});
AFRAME.registerComponent('click-to-wave', {
	me: null as Me | null,
	schema: {
		enabled: { default: true },
		userId: { default: '' }
	},
	init: function () {
		this.el.addEventListener('click', this.onClick.bind(this));
		if (!user) return;
	},
	onClick: async function (evt) {
		this.me = Users.find(user.id) as Me;
		console.log('clicked');
		if (!this.me) return;
		await this.me.sendLike(this.data.userId, 'wave', 1);
		toast(_('Waved'));
	}
});
