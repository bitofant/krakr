import logger from '../helper/logger';
const log = logger (module);


class SocketCollection {
	private sockets = [];

	removeSocket (socket) {
		for (var i = 0; i < this.sockets.length; i++) {
			if (this.sockets[i] === socket) {
				this.sockets.splice (i, 1);
				return;
			}
		}
	}

	add (socket) {
		this.sockets.push (socket);
		socket.on ('disconnect', () => {
			this.removeSocket (socket);
		});
	}

	emit (ev, data) {
		this.sockets.forEach (socket => {
			try {
				socket.emit (ev, data);
				return;
			} catch (err) {
				log (err);
			}
			try {
				socket.close ();
			} catch (err) {}
			this.removeSocket (socket);
		});
	};

}

export default SocketCollection;
