const schedule = require('node-schedule');
const { exec } = require("child_process");
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const OAuth2 = google.auth.OAuth2;

const MAIL_USER = process.env.MAIL_USER;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const ALERT_SEND = process.env.ALERT_SEND;

async function createTransporter() {
	const oauth2Client = new OAuth2(
		CLIENT_ID,
		CLIENT_SECRET,
		"https://developers.google.com/oauthplayground"
	);

	oauth2Client.setCredentials({
		refresh_token: REFRESH_TOKEN
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken((err, token) => {
			if (err) {
				reject(err);
			}
			resolve(token);
		});
	});

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: MAIL_USER,
			accessToken,
			clientId: CLIENT_ID,
			clientSecret: CLIENT_SECRET,
			refreshToken: REFRESH_TOKEN
		}
	});

	return transporter;
};

function runDailies() {
	console.log('Running hoyolab.py');
	exec(`python3 ${path.join(__dirname, 'hoyolab.py')}`, async (error, stdout, stderr) => {
		const all = stdout + stderr;
		console.log('Error: ' + error);
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (error || all.indexOf('Error: ') !== -1) {
			console.log('There was an error, sending email');
			const mailOptions = {
				from: MAIL_USER,
				to: ALERT_SEND,
				subject: 'Hoyolab Daily Checkin Error',
				text: `Error Messages:\nError:\n${error}\n\nstdout:\n${stdout}\n\nstderr:\n${stderr}`
			};

			try {
				const transporter = await createTransporter();

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
						return
					}
					console.log('Email sent! Info: ' + info.response);
				});
			}
			catch (error) {
				console.log(error);
			}
		}
	});
}

async function testEmail() {
	const mailOptions = {
		from: MAIL_USER,
		to: ALERT_SEND,
		subject: 'Hoyolab Daily Checkin Enabled',
		text: 'Email notifications are working'
	};

	try {
		const transporter = await createTransporter();

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
				return
			}
			console.log('Email sent! Info: ' + info.response);
		});
	}
	catch (error) {
		console.log(error);
	}
}

schedule.scheduleJob({ hour: 6, minute: 30 }, runDailies);

testEmail().then(() => {
	runDailies();
});
