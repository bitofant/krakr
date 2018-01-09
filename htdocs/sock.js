function CreateSocket () {
	if (typeof (io) !== 'undefined') {
		return io ();
	}
	return { connected: false };
}
const socket = CreateSocket ();
export default socket;