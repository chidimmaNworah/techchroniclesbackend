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
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body>
        <div style="position: relative;">
          <div syle="position: absolute; top: 50%; left: 50%; max-width: 420px; margin: 0 auto; font-family: sans-serif; color: #272727; text-align: center;">
            <p style="text-align: center; padding: 16px 0 16px 0; background: rgba(0,0,0,0.5); margin-bottom: 20px;">
              <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1681830645/techchronicles/kimmotech_new_logo-01-01_jqjnnb.png' alt='Kimmotech' width='120px' />
            </p>

          <h1 style="color: #fff; text-align: center; font-weight: 700; font-size: 2.5rem;">
            Verify your email address
          </h1>
            <p style="text-align: center; font-size: 1.5rem; color: #fff; margin-bottom: 1rem;">
            This email address was recently used to log into a Kimmotechnology Website. 
            If this was you, please verify your email address by clicking the following link:
            </p>
            <p style="text-align: center; font-size: 1.5rem; margin-bottom: 2rem;">
              <a href=${code} style="color: #51D4E9;" >
                Confirm my account
              </a>
            </p>
            <p style="text-align: center; font-size: 1.5rem; color: #fff;">
            If this was not you, you can safely delete this email
            </p>
            <hr/>
            <p style="text-align: center; font-size: 1rem; color: #fff;">
            If you are having any issues with your account, please contact the company through the contact details on the website
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
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body>
        <div style="position: relative;">
          <div syle="position: absolute; top: 50%; left: 50%; max-width: 420px; margin: 0 auto; font-family: sans-serif; color: #272727; text-align: center;">
            <p style="text-align: center; padding: 16px 0 16px 0; background: rgba(0,0,0,0.5); margin-bottom: 20px;">
              <img src='https://res.cloudinary.com/kimmoramicky/image/upload/v1681830645/techchronicles/kimmotech_new_logo-01-01_jqjnnb.png' alt='Kimmotech' width='120px' />
            </p>

          <h1 style="color: #fff; text-align: center; font-weight: 700; font-size: 2.5rem;">
            Reset your password
          </h1>
            <p style="text-align: center; font-size: 1.5rem; color: #fff; margin-bottom: 1rem;">
            This email address was recently used to request for a password reset. 
            If this was you, please verify your email address by clicking the following link:
            </p>
            <p style="text-align: center; font-size: 1.5rem; margin-bottom: 2rem;">
              <a href=${code} style="color: #51D4E9;" >
                Reset my password
              </a>
            </p>
            <p style="text-align: center; font-size: 1.5rem; color: #fff;">
            If this was not you, you can safely delete this email
            </p>
            <hr/>
            <p style="text-align: center; font-size: 1rem; color: #fff;">
            If you are having any issues with your account, please contact the company through the contact details on the website
            </p>            
          </div>
        </div>
    </body>
  </html>
  `;
};
