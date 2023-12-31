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
		navMeshURL: '/models/usfq_navmesh.glb',
		scale: 0.3
	},
	{
		name: _('Pyramid'),
		modelURL: '/models/pyramid.glb',
		navMeshURL: '/models/pyramid_navmesh.glb'
	},
	{
		name: _('Conference Room') + '1',
		modelURL: '/models/Room1.glb',
		navMeshURL: '/models/navmesh1.glb'
	},
	{
		name: _('Conference Room') + '2',
		modelURL: '/models/Room2.glb',
		navMeshURL: '/models/navmesh2.glb'
	},
	{
		name: _('Conference Room') + '3',
		modelURL: '/models/virteducaconfroomver4.glb',
		navMeshURL: '/models/auditnavmeshver3.glb'
	}
];
