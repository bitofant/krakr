import nodemailer = require ('nodemailer');
const auth = require ('./mail-auth.js');

const transporter = nodemailer.createTransport ({
	host: 'mail.gmx.net',
	port: 587,
	tls: {
		ciphers: 'SSLv3',
		rejectUnauthorized: false
	},
	debug: true,
	auth: auth
});



// const sendmail = mail ({
// 	logger: {
// 		debug: ()=>{},
// 		info: ()=>{}, //console.info,
// 		warn: console.warn,
// 		error: console.error
// 	}
// });

function sendMail (opts: {
	from: string,
	to: string,
	subject: string
	html: string
}, callback: (err: Error)=>void) {
	// var server = mail.Mail (opts.host);
	// server.message (opts.header).body (opts.body).send (callback);
	// sendmail (opts, (err, reply) => {
	// 	callback (err);
	// });
	transporter.sendMail (opts, (err, info) => {
		if (err) throw err;
		console.log (info);
	});
}

export { sendMail };
export default sendMail;
