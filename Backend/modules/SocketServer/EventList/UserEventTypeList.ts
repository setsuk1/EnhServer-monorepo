export const UserEventTypeList = {
	ROOM: {
		JOIN: 1,
		CREATE: 2,
		LEAVE: 3,
		LIST: 4,
		QUERY: 5,
	},
	MSG: {
		UNICAST: 11,
		BROADCAST_TO_ALL: 12,
		BROADCAST_IN_ROOM: 13
	},
	USER: {
		LIST: 21,
		QUERY: 22,
	},
	VAR: {
		SET: 101,
		DELETE: 102,
		GET: 103
	}
}