const httpStatus = require('http-status');
const request = require('request-promise');
const dotenv = require('dotenv');
const Contract = require('../../models/contract.model');
const KYCAML = require('../../models/kycaml.model');
const multer = require('multer');
const _ = require('lodash');

dotenv.config();

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './static/kyc');
    },
    filename: function (req, file, callback) {
        const ext = file.mimetype.split('/')[1];
        callback(null, file.fieldname + '-' + Date.now() + '.' + ext);
    }
});

exports.createKYCAML = async (req, res, next) => {
    const upload = multer({storage: storage}).fields([
        {name: 'photoK1'},
        {name: 'photoK2'},
        {name: 'photoK3'},
        {name: 'photoA'},
    ]);
    upload(req, res, err => {
        if (err) {
            return res.status(500).json({error: err.message});
        }
        let photoK = [];
        if (req.files["photoK1"]) {
            photoK.push(req.files["photoK1"][0].filename);
        }
        if (req.files["photoK2"]) {
            photoK.push(req.files["photoK2"][0].filename);
        }
        if (req.files["photoK3"]) {
            photoK.push(req.files["photoK3"][0].filename);
        }

        let photoA = [];
        if (req.files["photoA"]) {
            photoA.push(req.files["photoA"][0].filename);
        }

        const data = {
            userId: req.body.userId,
            contractId: req.body.contractId,
            poi: {
                photos: photoK,
                doctype: req.body.doctypeK,
            },
            pof: {
                photos: photoA,
                doctype: req.body.doctypeA,
            }
        };
        const kycaml = new KYCAML(data);
        kycaml.save().then(savedKYCAML => {
            return res.status(200).json(savedKYCAML);
        }).catch(err => {
            return res.status(500).json({error: true, message: err.message});
        });
    });
};

exports.listKYCAMLs = async (req, res, next) => {
    const adminId = req.user._id;
    Contract.find({userId: adminId}).sort('-createdAt').exec().then(contracts => {
        const contractId = req.query.contractId ? req.query.contractId : contracts[0]._id;
        KYCAML.list({contractId: contractId}).then(contracts => {
            return res.status(200).json(contracts);
        }).catch(err => {
            return res.status(500).json({error: true, message: err.message});
        });
    });
};

exports.getKYCAML = async (req, res, next) => {
    KYCAML.findOne({_id: req.params.id})
        .populate('userId')
        .select('id poi pof onlineVerified adminVerified userId verifier createdAt')
        .exec()
        .then(kycaml => {
            return res.status(200).json(kycaml);
        }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.updateKYCAML = async (req, res, next) => {
    const adminId = req.user._id;
    KYCAML.findOne({_id: req.params.id}).exec().then(kyc => {
        if (req.body.adminVerified) {
            kyc.adminVerified = req.body.adminVerified;
            kyc.verifier = req.user._id;
        }
        return kyc.save();
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    }).then(savedKYC => {
        return res.status(200).json(savedKYC);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.deleteKYCAML = async (req, res, next) => {
    KYCAML.remove({_id: req.params.id}).exec().then(response => {
        return res.status(200).json(response);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};

exports.requestOnlineVerify = async (req, res, next) => {
    KYCAML.findOne({_id: req.params.id}).exec().then(kyc => {
        kyc.onlineVerified = "Verified";
        kyc.poi.status = "Verified";
        kyc.pof.status = "Verified";
        return kyc.save();
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    }).then(savedKYC => {
        return res.status(200).json(savedKYC);
    }).catch(err => {
        return res.status(500).json({error: true, message: err.message});
    });
};
