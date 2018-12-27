const httpStatus = require('http-status');
const nodemailer = require('nodemailer');
const twoFactor = require('node-2fa');
const dotenv = require('dotenv');
const User = require('../../models/user.model');
const RefreshToken = require('../../models/refreshToken.model');
const EmailVerifyToken = require('../../models/emailVerifyToken.model');
const moment = require('moment-timezone');
const {jwtExpirationInterval} = require('../../config/vars');
const { sendVerifyEmail, sendForgotPasswordEmail } = require('../../helpers/mailer');
const {log} = require('../../helpers/logs');

dotenv.config({});
/**
 * Returns a formatted object with tokens
 * @private
 */
function generateTokenResponse(user, accessToken) {
    const tokenType = 'Bearer';
    const refreshToken = RefreshToken.generate(user).token;
    const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
    return {
        tokenType, accessToken, refreshToken, expiresIn,
    };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
    try {
        const duplicated = await User.checkDuplicateAdminEmail(req.body.email);
        if (duplicated) {
            throw new Error("Admin email is already existed.");
        }

        const user = await (new User(req.body)).save();
        const userTransformed = await user.transform();

        // send verification email
        const emailToken = EmailVerifyToken.generate(user).token;

        await sendVerifyEmail(process.env.UI_DOMAIN + '/email-confirmation', user.email, emailToken);

        res.status(httpStatus.CREATED);

        return res.json({user: userTransformed});
    } catch (error) {
        return res.status(httpStatus.BAD_REQUEST).json({error: error.message});
    }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
    try {
        const {user, accessToken} = await User.findAndGenerateToken({...req.body, role: "Admin"});
        // if (user.tfaEnabled) {
        //     return res.json({tfaEnabled: true});
        // }

        const token = generateTokenResponse(user, accessToken);
        const userTransformed = await user.transform();
        return res.json({token, user: userTransformed, tfaEnabled: false});
    } catch (error) {
        return next(error);
    }
};

/**
 * Check user's otp temporary token
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.verify2FAToken = async (req, res, next) => {
    try {
        const {user, accessToken} = await User.findAndGenerateToken({...req.body, role: "Admin"});
        if (!user.tfaSecret) {
            return res.status(400).json({code: 400, message: '2FA is not enabled'});
        }

        const verifyResult = twoFactor.verifyToken(user.tfaSecret, req.body.token);

        if (verifyResult === null) {
            return res.status(400).json({code: 400, message: 'Invalid token'});
        } else if (verifyResult.delta > 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too early'});
        } else if (verifyResult.delta < 0) {
            return res.status(400).json({code: 400, message: 'You entered the token too late'});
        } else if (verifyResult.delta === 0) {
            if (req.body.browserInfo) {
                await log(user._id, req.body.browserInfo, 'Login');
            }

            const token = generateTokenResponse(user, accessToken);
            const userTransformed = await user.transform();
            return res.json({token, user: userTransformed});
        }
    } catch (error) {
        next(error);
    }
};


/**
 * Returns jwt token if email confirmation token is valid
 * @public
 */
exports.emailConfirmation = async (req, res, next) => {
    try {
        const emailToken = await EmailVerifyToken.findOne({token: req.body.token});
        if (!emailToken) {
            return res.status(400).json({message: 'We are unable to verify your token'});
        }

        if (emailToken.expires < Date.now()) {
            return res.status(400).json({message: 'Token is already expired'});
        }

        const user = await User.findOne({_id: emailToken.userId});
        if (!user) {
            return res.status(400).json({message: 'We are unable to find a user for this token'});
        }

        if (user.emailVerified) {
            return res.status(400).json({message: 'Your email is already verified'});
        }

        await user.update({emailVerified: true});

        const token = generateTokenResponse(user, user.token());
        return res.status(200).json({token});
    } catch (error) {
        return next(error);
    }
};

/**
 * Resend verification email
 * @public
 */
exports.resendVerifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if (!user) {
            return res.status(400).json({message: 'We were unable to find a user with the email'});
        }

        if (user.emailVerified) {
            return res.status(400).json({message: 'This account has already been verified. Please log in'});
        }

        // send verification email
        const emailToken = EmailVerifyToken.generate(user).token;

        await sendVerifyEmail(process.env.UI_DOMAIN + '/auth/email-confirmation', user.email, emailToken);

        return res.status(200).json({message: 'We have sent verification email again'});
    } catch (error) {
        return next(error);
    }
};


/**
 * Handle request to forgot password and send email
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.requestForgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if (!user) {
            return res.status(400).json({message: 'We were unable to find a user with the email'});
        }

        const token = user.passwordToken();
        const expires = moment().add(1, 'hours').toDate();
        user.passwordResetToken = token;
        user.passwordResetExpires = expires;
        await user.save();

        await sendForgotPasswordEmail(process.env.UI_DOMAIN + '/reset-password', user.email, user.fullName, token)
        return res.status(200).json({message: 'We have just sent instructions to your email'});
    } catch (error) {
        return next(error);
    }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.checkResetToken = async (req, res, next) => {
    try {
        if (!req.body.token) {
            return res.status(400).json({message: 'Password reset token is required'});
        }

        const user = await User.findOne({passwordResetToken: req.body.token}).where('passwordResetExpires').gt(Date.now()).exec();
        if (!user) {
            return res.status(400).json({message: 'Password reset token is invalid or has expired'});
        }

        return res.status(200).json({message: 'Password reset token is valid'});
    } catch (error) {
        return next(error);
    }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
exports.resetPassword = async (req, res, next) => {
    try {
        if (!req.body.token) {
            return res.status(400).json({message: 'Password reset token is required'});
        }

        const user = await User.findOne({passwordResetToken: req.body.token}).where('passwordResetExpires').gt(Date.now()).exec();
        if (!user) {
            return res.status(400).json({message: 'Password reset token is invalid or has expired'});
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({message: 'Your password has been changed'});
    } catch (error) {
        return next(error);
    }
};


/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
    try {
        const {user} = req;
        const accessToken = user.token();
        const token = generateTokenResponse(user, accessToken);
        const userTransformed = await user.transform();
        return res.json({token, user: userTransformed});
    } catch (error) {
        return next(error);
    }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
    try {
        const {email, refreshToken} = req.body;
        const refreshObject = await RefreshToken.findOneAndRemove({
            userEmail: email,
            token: refreshToken,
        });
        const {user, accessToken} = await User.findAndGenerateToken({email, refreshObject, role: "Admin"});
        const response = generateTokenResponse(user, accessToken);
        return res.json(response);
    } catch (error) {
        return next(error);
    }
};
