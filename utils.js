import jwt from 'jsonwebtoken';
import mg from 'mailgun-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

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
  nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: process.env.MAILTRAP_SECURE,
    auth: {
      user: process.env.MAILTRAP_USERNAME,
      pass: process.env.MAILTRAP_PASSWORD,
    },
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
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: process.env.MAILTRAP_SECURE,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    transporter.sendMail(
      {
        from: process.env.USER,
        to: email,
        subject: subject,
        html: generateEmailTemplate(url),
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('email sent' + info.response);
        }
      }
    );
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
        <div style="position: relative;">
          <div syle="position: absolute; top: 50%; left: 50%; max-width: 420px; margin: 0 auto; font-family: sans-serif; color: #272727; text-align: center;">
            <p style="text-align: center; padding: 16px 0 16px 0; background: #421C8D; margin-bottom: 20px;">
              <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1675863431/nailsrepublic/web_logo_name_umaqtm.png' alt='nails republic' width='120px' />
            </p>
            <p style="text-align: center; background: #fff; margin-bottom: 20px;">
              <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1675868483/nailsrepublic/web_pic_name-removebg-preview_k3w2hj.png' alt='nails republic' width='300px' />
            </p>
          <h2 style="color: #421C8D; text-align: center;">
            Thank you for registering!
          </h2>
            <p style="text-align: center;">
              Please Confirm your Sign up email by clicking on one of the following: 
            </p>
            <p style="text-align: center; margin-bottom: 20px;">
              <a href=${code} style="text-decoration: none; color: #fff;" >
                <button style="padding: 10px 20px 10px 20px; font-weight: 400; text-align: center; background: #421C8D; color: #fff;">
                  Confirm
                </button>
              </a>
            </p
              <div style="margin-bottom: 20px;">
            <p style="text-align: center;">or copy the code below and paste this code in your web browser</p>
            <a href=${code} style="text-decoration: none; text-align: center;" > ${code}</a>
            </div>
            <p style="text-align: center; margin-botton: 40px;">
              If you received this email by mistake, simply delete it. You won't be registered if you don't click the confirmation link above.
            </p>
            <p style="text-align: center;">
              Thank you!
            </p>
            <p style="text-align: center;">
              Kimmora
            </p>
            <hr />
            <p style="text-align: center; margin-botton: 20px;">
            +234 9070361277
            </p>
            <p style="text-align: center;">
            info@nailsrepublic.shop
            </p>
            <p style="text-align: center;">
              www.nailsrepublic.shop
            </p>
            <p style="text-align: center;">
              If you face any issue with shopping on our website, please reach out to us along with the complete screenshot of the issue.
            </p>
            <p style="text-align: center;">
              Write to us for additional assistance.
            </p>
          </div>
        </div>
    </body>
  </html>
  `;
};

export const passwordResetMail = async (email, subject, url) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: process.env.MAILTRAP_SECURE,
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
          <p style="text-align: center; padding: 16px 0 16px 0; background: #421C8D; margin-bottom: 20px;">
          <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1675863431/nailsrepublic/web_logo_name_umaqtm.png' alt='nails republic' width='120px' />
        </p>
            <p style="text-align: center;">Please Confirm your email by clicking on one of the following, to reset your password: </p>
            <p style="text-align: center;">
            <a href=${code} style="text-decoration: none; color: #fff;" >
              <button style="padding: 10px 20px 10px 20px; font-weight: 400; text-align: center; background: #421C8D; color: #fff;">
                Confirm
              </button>
            </a>
            </p>
            <p style="text-align: center;">or</p>
            <p style="text-align: center;">
            <a href=${code} style="text-decoration: none;" > ${code}</a>
            </p>
            <p style="text-align: center; margin-botton: 40px;">
              If you received this email by mistake, simply delete it. You won't be registered if you don't click the confirmation link above.
            </p>
            <p style="text-align: center;">
              Thank you!
            </p>
            <p style="text-align: center;">
              Kimmora
            </p>
            <hr />
            <p style="text-align: center; margin-botton: 20px;">
            +234 9070361277
            </p>
            <p style="text-align: center;">
            info@nailsrepublic.shop
            </p>
            <p style="text-align: center;">
              www.nailsrepublic.shop
            </p>
            <p style="text-align: center;">
              If you face any issue with shopping on our website, please reach out to us along with the complete screenshot of the issue.
            </p>
            <p style="text-align: center;">
              Write to us for additional assistance.
            </p>
            </p>
          </div>
        </div>
    </body>
  </html>
  `;
};

export const welcomeMailTransport = async (email, subject, heading) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: process.env.MAILTRAP_SECURE,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: plainEmailTemplate(heading),
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
          <p style="text-align: center; padding: 16px 0 16px 0; background: #421C8D; margin-bottom: 20px;">
              <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1675863431/nailsrepublic/web_logo_name_umaqtm.png' alt='nails republic' width='120px' />
            </p>
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
            <hr />
            <p style="text-align: center; margin-botton: 20px;">
            +234 9070361277
            </p>
            <p style="text-align: center;>
            info@nailsrepublic.shop
            </p>
            <p style="text-align: center;>
              www.nailsrepublic.shop
            </p>
            <p style="text-align: center;>
              If you face any issue with shopping on our website, please reach out to us along with the complete screenshot of the issue.
            </p>
            <p style="text-align: center;>
              Write to us for additional assistance.
            </p>
            </p>
          </div>
        </div>
    </body>
  </html>
  `;
};
