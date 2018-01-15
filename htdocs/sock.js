function CreateSocket () {
	if (typeof (io) !== 'undefined') {
		return io (location.href);
	}
	return { connected: false };
}
const socket = CreateSocket ();
export default socket;
