import { _ } from '$lib/i18n';
export type Environment = {
	name: string;
	modelURL: string;
	navMeshURL: string;
	scale?: number;
	component?: string;
	componentDefaultValues?: string;
};

export const EnvironmentModelPresets: Environment[] = [
	{
		name: _('None'),
		modelURL: '',
		navMeshURL: ''
	},
	{
		name: _('Classroom'),
		modelURL: '/models/classroom_merged.glb',
		navMeshURL: ''
	},
	{
		name: _('Floating Restaurant'),
		modelURL: '/models/floating_restaurant.glb',
		navMeshURL: ''
	},
	{
		name: _('House'),
		modelURL: '/models/black_office.glb',
		navMeshURL: ''
	},
	{
		name: _('Office'),
		modelURL: '/models/studio_office.glb',
		navMeshURL: ''
	},
	{
		name: _('Conference Room'),
		modelURL: '/models/conference_room.glb',
		navMeshURL: ''
	},
	{
		name: _('Squid Game'),
		modelURL: '/models/squidgame.glb',
		navMeshURL: '/models/squidgame_navmesh.glb',
		component: 'squid-game'
	},
	{
		name: _('Maze Game'),
		modelURL: '/models/maze.glb',
		navMeshURL: '/models/maze_navmesh.glb',
		component: 'maze-game'
	},
	{
		name: _('UFSQ'),
		modelURL: '/models/usfq2.glb',
		navMeshURL: '',
		scale: 0.25
	}
];
