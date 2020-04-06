const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'andrew@mead.io',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.` 
    })//only can use ${} with back ticks
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'andrew@mead.io',
        subject: 'Your account has been deleted.',
        text: `Sorry to see you go, ${name}. Let me know how we could've kept you on board.` 
    })//only can use ${} with back ticks
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}