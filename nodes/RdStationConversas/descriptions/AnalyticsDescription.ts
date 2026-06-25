import type { INodeProperties } from 'n8n-workflow';

const analyticsOperations = [
	'getAttendanceRetention',
	'getAttendanceReviewsAverage',
	'getAttendanceSummary',
	'getContactsOrigin',
];

const filteredAnalyticsOperations = [
	'getAttendanceReviewsAverage',
	'getAttendanceSummary',
];

export const analyticsDescription: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'analyticsStartDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: analyticsOperations,
			},
		},
		description: 'Start date for the analytics period. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'End Date',
		name: 'analyticsEndDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: analyticsOperations,
			},
		},
		description: 'End date for the analytics period. Sent as YYYY-MM-DD.',
	},
	{
		displayName: 'Timezone',
		name: 'analyticsTimezone',
		type: 'string',
		default: 'America/Sao_Paulo',
		required: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: [
					'getAttendanceRetention',
					'getAttendanceReviewsAverage',
					'getAttendanceSummary',
				],
			},
		},
		description: 'IANA timezone identifier used by the API',
	},
	{
		displayName: 'Department IDs',
		name: 'analyticsDepartmentIds',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: filteredAnalyticsOperations,
			},
		},
		description: 'Optional comma-separated department IDs',
	},
	{
		displayName: 'Employee IDs',
		name: 'analyticsEmployeeIds',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: filteredAnalyticsOperations,
			},
		},
		description: 'Optional comma-separated employee IDs',
	},
];
