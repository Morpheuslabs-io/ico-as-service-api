const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Email Verify Token Schema
 * @private
 */
const emailVerifyTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: 'String',
    required: true,
  },
  expires: { type: Date },
}, {
    timestamps: true,
});

emailVerifyTokenSchema.statics = {

  /**
   * Generate a email verification token object and saves it into the database
   *
   * @param {User} user
   * @returns {EmailVerifyToken}
   */
  generate(user) {
    const userId = user._id;
    let token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    token = token.replace(".","");
    const expires = moment().add(1, 'days').toDate();
    const tokenObject = new EmailVerifyToken({
      userId, token, expires,
    });
    tokenObject.save();
    return tokenObject;
  },

};

/**
 * @typedef EmailVerifyToken
 */
const EmailVerifyToken = mongoose.model('EmailVerifyToken', emailVerifyTokenSchema);
module.exports = EmailVerifyToken;
