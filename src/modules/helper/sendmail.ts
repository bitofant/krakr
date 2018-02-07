import nodemailer = require ('nodemailer');
import props from '../../application-properties';
const auth: {username:string,password:string} = require ('./mail-auth.js');

var transporter = null;
setTimeout (() => {
	transporter = nodemailer.createTransport ({
	 host: 'mail.gmx.net',
	 port: 587,
	 tls: {
		 ciphers: 'SSLv3',
		 rejectUnauthorized: false
	 },
	 debug: true,
	 auth: auth
 });
}, 5000);



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
	if (props.disableEMails && callback) return (callback (null));
	if (transporter === null) return callback (new Error ('not initialized yet'));
	transporter.sendMail (opts, (err, info) => {
		callback (err);
	});
}

export { sendMail };
export default sendMail;
