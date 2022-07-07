require('dotenv').config();
const schedule = require('node-schedule');
const { exec } = require("child_process");
const nodemailer = require('nodemailer');

const MAIL_USER = process.env.MAIL_USER;
const CLIENT_ID = process.env.MAIL_PASS;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const ALERT_SEND = process.env.ALERT_SEND;

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		type: 'OAuth2',
		user: MAIL_USER,
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		refreshToken: REFRESH_TOKEN,
		accessToken: ACCESS_TOKEN
	}
});

schedule.scheduleJob({ hour: 5, minute: 0 }, () => {
	exec("python3 hoyolab.py", (error, stdout, stderr) => {
		const all = stdout + stderr;
		if (error || all.indexOf('Error: ') !== -1) {
			const mailOptions = {
				from: MAIL_USER,
				to: ALERT_SEND,
				subject: 'Hoyolab Daily Checkin Error',
				text: `Error Messages:\nError:\n${error}\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}`
			};

			transporter.sendMail(mailOptions, function (error, info) {
				if (error) { console.log(error); }
			});
		}
	});
});