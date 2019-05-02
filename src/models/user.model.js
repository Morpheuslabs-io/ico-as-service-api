const mongoose = require('mongoose');
const httpStatus = require('http-status');
const {omitBy, isNil} = require('lodash');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');
const {env, jwtSecret, jwtExpirationInterval} = require('../config/vars');

/**
 * User Roles
 */
const roles = ['user', 'admin'];

/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        match: /^\S+@\S+\.\S+$/,
        required: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 128,
    },
    fullName: {
        type: String,
        maxlength: 128,
        index: true,
        trim: true,
    },
    phone: {
        type: String,
        maxlength: 20,
    },
    address: {
        type: String,
        maxlength: 256,
        trim: true,
    },
    city: {
        type: String,
        maxlength: 128,
        trim: true,
    },
    country: {
        type: String,
        maxlength: 128,
        trim: true,
    },
    ips: [],
    emailVerified: {
        type: Boolean,
        default: true,
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    tfaEnabled: {
        type: Boolean,
        default: false
    },
    tfaSecret: {
        type: String
    },
    role: {
        type: String
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
    },
    ethAddress: {
        type: String
    },
    whitelisted: {
        type: String,
        default: 'no'
    },
    uiconfig: {
      type: String,
      default: 'ui setting,dashboard,ico,token vesting,kyc & aml,investors, airdrop'
  }
}, {
    timestamps: true,
    usePushEach: true
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
    try {
        if (!this.isModified('password')) return next();

        const rounds = env === 'test' ? 1 : 10;

        const hash = await bcrypt.hash(this.password, rounds);
        this.password = hash;

        return next();
    } catch (error) {
        return next(error);
    }
});

/**
 * Methods
 */
userSchema.method({
    async transform() {
        const transformed = {};
        const fields = ['id', 'fullName', 'email', 'phone', 'address', 'city', 'state', 'country', 'ips', 'createdAt', 'uiconfig'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    },

    token() {
        const playload = {
            exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
            iat: moment().unix(),
            sub: this._id,
        };
        return jwt.encode(playload, jwtSecret);
    },

    passwordToken() {
        return crypto.randomBytes(40).toString('hex');
    },

    async passwordMatches(password) {
        return bcrypt.compare(password, this.password);
    },
});

/**
 * Statics
 */
userSchema.statics = {

    roles,

    /**
     * Get user
     *
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    async get(id) {
        try {
            let user;

            if (mongoose.Types.ObjectId.isValid(id)) {
                user = await this.findById(id).exec();
            }
            if (user) {
                return user;
            }

            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },

    /**
     * Find user by email and tries to generate a JWT token
     *
     * @param {ObjectId} options - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    async findAndGenerateToken(options) {
        const {email, password, refreshObject, role, contractId} = options;
        if (!email) throw new APIError({message: 'An email is required to generate a token'});

        const opt = {
            email,
            role,
        };
        if (role == "Investor") {
            opt.contractId = contractId;
        }

        const user = await this.findOne(opt).exec();
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };

        if (user && !user.emailVerified) {
            err.message = 'Your account has still not been verified';
            throw new APIError(err);
        }

        if (password) {
            if (user && await user.passwordMatches(password)) {
                return {user, accessToken: user.token()};
            }
            err.message = 'Incorrect email or password';
        } else if (refreshObject && refreshObject.userEmail === email) {
            if (moment(refreshObject.expires).isBefore()) {
                err.message = 'Invalid refresh token.';
            } else {
                return {user, accessToken: user.token()};
            }
        } else {
            err.message = 'Incorrect email or refreshToken';
        }
        throw new APIError(err);
    },

    list(opt = {}) {
        return this.find(opt)
            .sort({createdAt: -1})
            .exec();
    },

    checkDuplicateAdminEmail(email) {
        return this.find({email: email, role: "Admin"}).count().exec();
    },

    checkDuplicateEmail(error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            return new APIError({
                message: 'Validation Error',
                errors: [{
                    field: 'email',
                    location: 'body',
                    messages: ['"email" already exists'],
                }],
                status: httpStatus.CONFLICT,
                isPublic: true,
                stack: error.stack,
            });
        }
        return error;
    },
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', userSchema);
