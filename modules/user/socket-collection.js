const log = require ('../helper/logger') (module);


function SocketCollection () {
	var sockets = [];

	function removeSocket (socket) {
		for (var i = 0; i < sockets.length; i++) {
			if (sockets[i] === socket) {
				sockets.splice (i, 1);
				return;
			}
		}
	}

	this.add = socket => {
		sockets.push (socket);
		socket.on ('disconnect', () => {
			removeSocket (socket);
		});

		this.emit = (ev, data) => {
			sockets.forEach (socket => {
				try {
					socket.emit (ev, data);
					return;
				} catch (err) {
					log (err);
				}
				try {
					socket.close ();
				} catch (err) {}
				removeSocket (socket);
			});
		};

	};

}

module.exports = SocketCollection;
