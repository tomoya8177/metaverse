<script lang="ts">
	import { Event } from '$lib/frontend/Classes/Event';
	import { myConfirm, toast } from '$lib/frontend/toast';
	import { _ } from '$lib/i18n';
	import { page } from '$app/stores';
	import InputWithLabel from '../../../../Components/Molecules/InputWithLabel.svelte';
	import { convertLocalToUTC } from '$lib/frontend/convertLocalToUTC';
	import type { Room } from '$lib/frontend/Classes/Room';
	import type { Organization } from '$lib/types/Organization';
	import type { User } from '$lib/frontend/Classes/User';
	import Icon from '../../../../Components/Atom/Icon.svelte';
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { Attendance } from '$lib/frontend/Classes/Attendance';
	import { DateTime } from 'luxon';
	export let editEvent: Event;
	export let editMode: 'create' | 'update' = 'update';
	export let modalOpen: boolean;
	export let organization: Organization;
	export let rooms: Room[];
	export let users: User[];
	export let onUpdateDone: (event: Event) => void;
	export let onDeleteDone: (event: Event) => void;
	export let onCreateDone: (event: Event) => void;
	let attendances: Attendance[] = [];
	onMount(async () => {
		attendances = await axios
			.get('/api/attendances?event=' + editEvent.id)
			.then((res) => res.data.map((attendance) => new Attendance(attendance)));
	});
</script>

<div class="flexOnWideScreen">
	<div>
		<InputWithLabel label={_('Title')} bind:value={editEvent.summary} />
		<div style="display:flex;gap:0.2rem">
			<InputWithLabel label={_('Start Date')} bind:value={editEvent.startDate} type="date" />
			{#if !editEvent.allDay}
				<InputWithLabel label={_('Start Time')} bind:value={editEvent.startTime} type="time" />
			{/if}
			<InputWithLabel label={_('All Day')} bind:value={editEvent.allDay} type="switch" />
		</div>
		<div style="display:flex;gap:0.2rem">
			<InputWithLabel label={_('End Date')} bind:value={editEvent.endDate} type="date" />
			{#if !editEvent.allDay}
				<InputWithLabel label={_('End Time')} bind:value={editEvent.endTime} type="time" />
			{/if}
		</div>
		<InputWithLabel
			label={_('Link to Room')}
			bind:value={editEvent.url}
			type="select"
			selects={[
				{
					name: _('No Link'),
					value: ''
				},
				...rooms.map((room) => {
					return {
						name: room.title,
						value: `${$page.url.protocol}//${$page.url.host}/${organization.slug}/${room.id}`
					};
				})
			]}
		/>
		<InputWithLabel label={_('URL')} bind:value={editEvent.url} type="url" />
		<InputWithLabel label={_('Description')} bind:value={editEvent.description} type="textarea" />
	</div>
	<div>
		<section>
			<strong>
				{_('Attendance')}
			</strong>
			{#each users.filter((user) => !attendances.some((attendance) => attendance.user == user.id)) as user}
				<div style="display:flex">
					<div style="flex:1">
						{user.nickname}
					</div>
					<div style="width:8rem;text-align:right">
						<a
							href={'#'}
							on:click={async () => {
								const newAttendance = new Attendance({
									user: user.id,
									event: editEvent.id,
									status: 'unknown'
								});
								await newAttendance.create();
								attendances.push(newAttendance);
								attendances = attendances;
							}}
						>
							<Icon icon="email" />
							{_('Invite')}
						</a>
					</div>
				</div>
			{/each}
		</section>
		<section>
			<strong>
				{_('Attending Users')}
			</strong>
			{#each attendances as attendance}
				{@const user = users.find((user) => user.id == attendance.user)}
				{#if user}
					<div>
						<div style="display:flex;gap:0.6rem">
							<div style="flex:1">
								{user.nickname}
							</div>
							<div>
								<a
									href={'#'}
									on:click={async () => {
										const data = await editEvent.ical([user]);
										console.log(data);
										toast(`${_('Sent an invitation to ')}${user.nickname}`);
									}}
								>
									<Icon icon="email" />
									{_('Send Invitation')}
								</a>
							</div>
							<div style="width:1rem;text-align:right">
								<a
									href={'#'}
									on:click={() => {
										attendance.delete();
										attendances = attendances.filter((a) => a.id != attendance.id);
									}}
								>
									<Icon icon="delete" />
								</a>
							</div>
						</div>
						{#if editEvent.end > DateTime.now().toISO()}
							<div style="display:flex;gap:0.2rem">
								{#each [{ key: 'unknown', label: _('Unknown') }, { key: 'attending', label: _('Attending') }, { key: 'notAttending', label: _('Not Attending') }] as status}
									<div>
										<a
											class:outline={attendance.status != status.key}
											href={'#'}
											role="button"
											on:click={async () => {
												status.key = status.key;
												attendance.status = status.key;
												await attendance.update();
												toast(_('Updated'));
											}}
										>
											{status.label}
										</a>
									</div>
								{/each}
							</div>
						{:else}
							<div style="display:flex;gap:0.2rem">
								{#each [{ key: 'present', label: _('Present') }, { key: 'absent', label: _('Absent') }, { key: 'late', label: _('Late') }, { key: 'excused', label: _('Excused') }, { key: 'leftEarly', label: _('Left Early') }] as status}
									<div>
										<a
											class:outline={attendance.status != status.key}
											href={'#'}
											role="button"
											on:click={async () => {
												attendance.status = status.key;
												await attendance.update();
												toast(_('Updated'));
											}}
										>
											{status.label}
										</a>
									</div>
								{/each}
							</div>
						{/if}
						<InputWithLabel
							label={_('Comment')}
							bind:value={attendance.description}
							onChange={async () => {
								await attendance.update();
								toast(_('Updated'));
							}}
						/>
					</div>
				{/if}
			{/each}
		</section>
		<section>
			<strong>
				{_('Send Invitation')}
				<button
					on:click={async () => {
						const data = await editEvent.ical(
							attendances.map((atte) => users.find((user) => user.id == atte.user))
						);
						console.log(data);
						toast(`${_('Sent invitations to users.')}`);
					}}
				>
					<Icon icon="email" />
					{_('Send Invitation')}
				</button>
			</strong>
		</section>
	</div>
</div>

{#if editMode == 'create'}
	<button
		on:click={async () => {
			if (!editEvent.validate()) return;
			modalOpen = false;
			editEvent.start = convertLocalToUTC(editEvent.start);
			editEvent.end = convertLocalToUTC(editEvent.end);
			console.log(editEvent.start, editEvent.end);
			const createdEvent = new Event(await editEvent.create());
			toast(_('Created'));
			onCreateDone(createdEvent);
		}}>{_('Create')}</button
	>
	<button class="secondary" on:click={() => (modalOpen = false)}>{_('Cancel')}</button>
{:else}
	<button
		on:click={async () => {
			if (!editEvent.validate()) return;
			//close modal first
			modalOpen = false;

			editEvent.start = convertLocalToUTC(editEvent.start);
			editEvent.end = convertLocalToUTC(editEvent.end);
			await editEvent.update();
			toast(_('Updated'));
			onUpdateDone(editEvent);
		}}>{_('Update')}</button
	>
	<button class="secondary" on:click={() => (modalOpen = false)}>{_('Cancel')}</button>
	<button
		class="secondary"
		on:click={async () => {
			if (!(await myConfirm(_('Are you sure?')))) {
				return;
			}
			modalOpen = false;

			await editEvent.delete();
			toast(_('Deleted'));
			onDeleteDone(editEvent);
		}}>{_('Delete')}</button
	>
{/if}

<style>
	a[role='button'] {
		padding: 0.5rem;
		border-radius: 0.5rem;
		font-size: 0.8rem;
	}
</style>
