import jwt from 'jsonwebtoken';
import mg from 'mailgun-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
};

export const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length); // Bearer XXXXXX
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        req.user = decode;
        next();
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: 'Invalid Admin Token' });
  }
};

export const mailgun = () =>
  mg({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  });

export const payOrderEmailTemplate = (order) => {
  return `<h1>Thanks for shopping with us</h1>
    <p>
    Hi ${order.user.name},</p>
    <p>We have finished processing your order.</p>
    <h2>[Order ${order._id}] (${order.createdAt
    .toString()
    .substring(0, 10)})</h2>
    <table>
    <thead>
    <tr>
    <td><strong>Product</strong></td>
    <td><strong>Quantity</strong></td>
    <td><strong align="right">Price</strong></td>
    </thead>
    <tbody>
    ${order.orderItems
      .map(
        (item) => `
      <tr>
      <td>${item.name}</td>
      <td align="center">${item.quantity}</td>
      <td align="right"> $${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('\n')}
    </tbody>
    <tfoot>
    <tr>
    <td colspan="2">Items Price:</td>
    <td align="right"> $${order.itemsPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2">Shipping Price:</td>
    <td align="right"> $${order.shippingPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2"><strong>Total Price:</strong></td>
    <td align="right"><strong> $${order.totalPrice.toFixed(2)}</strong></td>
    </tr>
    <tr>
    <td colspan="2">Payment Method:</td>
    <td align="right">${order.paymentMethod}</td>
    </tr>
    </table>
    <h2>Shipping address</h2>
    <p>
    ${order.shippingAddress.fullName},<br/>
    ${order.shippingAddress.address},<br/>
    ${order.shippingAddress.city},<br/>
    ${order.shippingAddress.country},<br/>
    ${order.shippingAddress.postalCode}<br/>
    </p>
    <hr/>
    <p>
    Thanks for shopping with us.
    </p>
    `;
};

export const generateOTP = () => {
  let otp = '';
  for (let i = 0; i <= 3; i++) {
    const randomValue = Math.round(Math.random() * 9);
    otp = otp + randomValue;
  }
  return otp;
};

export const mailTransport = async (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      // service: process.env.SERVICE,
      // secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: generateEmailTemplate(url),
    });
    console.log('email sent successfully');
  } catch (error) {
    console.log('email not sent');
    console.log(error);
  }
};

export const generateEmailTemplate = (code) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <style>
        @media only screen and (max-width: 620px){
          h1{
            font-size: 20px;
            padding: 5px
          }
        }
      </style>
    </head>
    <body>
        <div>
          <div syle="max-width: 620px; margin: 0 auto; font-family: sans-serif; color: #272727;">
            <h2 style="padding: 16px 0 16px 0; color: #421C8D;">
                Nails Republic
            </h2>
            <p>Please Confirm your Sign up email by clicking on one of the following: </p>
            <a href=${code} style="text-decoration: none; color: #fff;" ><button style="padding: 10px 20px 10px 20px; font-weight: 400; text-align: center; background: #421C8D; color: #fff;">Confirm</button> </a>
            <p>or</p>
            <a href=${code} style="text-decoration: none;" > ${code}</a>
            <p>If you received this email by mistake, simply delete it. You won't be registered if you don't click the confirmation link above.
</br> </br>
            Thank you!
            </br>
            Kimmora</p>
          </div>
        </div>
    </body>
  </html>
  `;
};

export const passwordResetMail = async (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      // service: process.env.SERVICE,
      // secure: Boolean(process.env.SECURE),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: passwordResetEmail(url),
    });
    console.log('email sent successfully');
  } catch (error) {
    console.log('email not sent');
    console.log(error);
  }
};

export const passwordResetEmail = (code) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <style>
        @media only screen and (max-width: 620px){
          h1{
            font-size: 20px;
            padding: 5px
          }
        }
      </style>
    </head>
    <body>
        <div>
          <div syle="max-width: 620px; margin: 0 auto; font-family: sans-serif; color: #272727;">
            <h2 style="padding: 16px 0 16px 0; color: #421C8D;">
                Nails Republic
            </h2>
            <p>Please Confirm your email by clicking on one of the following, to reset your password: </p>
            <a href=${code} style="text-decoration: none; color: #fff;" ><button style="padding: 10px 20px 10px 20px; font-weight: 400; text-align: center; background: #421C8D; color: #fff;">Confirm</button> </a>
            <p>or</p>
            <a href=${code} style="text-decoration: none;" > ${code}</a>
            <p>If you received this email by mistake, simply delete it.
</br> </br>
            Thank you!
            </br>
            Kimmora</p>
          </div>
        </div>
    </body>
  </html>
  `;
};

export const welcomeMailTransport = async (email, subject, heading) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.MAILTRAP_Host,
      // port: process.env.MailTrapPort,
      // Username: process.env.MAILTRAP_USERNAME,
      // Password: process.env.MAILTRAP_PASSWORD,
      // Auth: process.env.MAILTRAP_AUTH,
      // STARTTLS: process.env.MAILTRAP_STARTTLS,

      // service: process.env.SERVICE,
      // secure: Boolean(process.env.SECURE),
      // auth: {
      //   user: process.env.MAILTRAP_USERNAME,
      //   pass: process.env.MAILTRAP_PASSWORD,
      // },

      name: 'www.nailsrepublic.shop',
      host: 'smtp.titan.email',
      port: 587,
      secure: true,
      auth: {
        user: 'info@nailsrepublic.shop',
        pass: '64259775274',
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: plainEmailTemplate(heading),
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log('Server is ready to take our messages');
      }
    });
    console.log('email sent successfully');
  } catch (error) {
    console.log('email not sent');
    console.log(error);
  }
};

export const plainEmailTemplate = (heading) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <style>
        @media only screen and (max-width: 620px){
          h1{
            font-size: 20px;
            padding: 5px
          }
        }
      </style>
    </head>
    <body>
        <div>
          <div syle="max-width: 620px; margin: 0 auto; font-family: sans-serif; color: #272727;">
            <h1 style="background: #f6f6f6; padding: 10px; text-align: center; font-family: sans-serif; color: #272727;">
                ${heading}
            </h1>
            <p style="color: #272727; text-align: center;">
            We are super excited to see you join the Nails Republic community. </br>
            </br>
            We hope you will be happy with products offered by the Nails Republic and that you will shop with us again and again.
            </br>
            </br>
            Our goal is to offer the widest range of Nail Accessories by Nails Republic at the highest quality. If you think we should add any items to our store, do not hesitate to contact us and share your feedback.
            </br>
            </br>
            Until then, enjoy your shopping!
            </br>
            </br>
            Best Regards,
            </br>
            Nails Republic Customer Service Team
            
            </p>
          </div>
        </div>
    </body>
  </html>
  `;
};
