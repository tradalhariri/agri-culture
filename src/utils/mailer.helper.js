require('dotenv').config()
const nodemailer = require('nodemailer');
const nodemailerTransport = require('nodemailer-smtp-transport');
const handlebars = require('handlebars');
const fs = require('fs');
const mailConfig = require("../config/mailer")
const path = require("path");



// Added footer and header to template "handlebars file"
handlebars.registerPartial("header", fs.readFileSync(path.join(__dirname, "/templateEmail/partials/header.hbs"), "utf8"));
handlebars.registerPartial("footer", fs.readFileSync(path.join(__dirname, "/templateEmail/partials/footer.hbs"), "utf8"));


// Read the file and decode 
const readHTMLFile = (path, callback) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, html) => {
        if (err) {
            callback(err);
            throw err;

        } else {
            callback(null, html);
        }
    });
};

// Create Transport from nodemailer-smtp-transport and fill it
const smtpTransport = nodemailer.createTransport(nodemailerTransport({
    host: mailConfig.host,
    secure: mailConfig.secure,
    port: mailConfig.port,
    auth: {
        user: mailConfig.user,
        pass: mailConfig.pass
    }
}));


/**
 * 
 * Send email for user incloud token and his name and info for template
 * 
 * @param obj 
 *     const obj = {
 *      nameFile : "otp",
 *      lang:"en",
 *      subject:"Verification Email",
 *      token:token.token,
 *      user:response
 *     }
 *
 */
const sendEmail = (obj) => {
    readHTMLFile(__dirname + `/templateEmail/${obj.lang}/${obj.nameFile}.hbs`, (err, html) => {
        if (err) return(err);

        const template = handlebars.compile(html);

        const replacements = {
            fullName: obj.name,
            password: obj.password
        };
        // Send data for template
        const htmlToSend = template(replacements);

        // fill info for email
        const mailOptions = {
            from: 'my@email.com',
            to: obj.email,
            subject: obj.subject,
            html: htmlToSend
        };

        // Send email with data
        smtpTransport.sendMail(mailOptions, (error, response) => {
            if (error) {
                console.log(error);
                return(error);
            }
        });
    });
}
module.exports = sendEmail