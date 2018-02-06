import mail = require ('sendmail');
const sendmail = mail ({
	logger: {
		debug: ()=>{},
		info: ()=>{}, //console.info,
		warn: console.warn,
		error: console.error
	}
});

function sendMail (opts: {
	from: string,
	to: string,
	subject: string
	html: string
}, callback: (err: Error)=>void) {
	// var server = mail.Mail (opts.host);
	// server.message (opts.header).body (opts.body).send (callback);
	sendmail (opts, (err, reply) => {
		callback (err);
	});
}

export { sendMail };
export default sendMail;
