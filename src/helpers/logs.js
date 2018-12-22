const ActionHistory = require('../models/actionHistory.model');

exports.log = async (userId, browserInfo, action) => {
    let history = await ActionHistory.findOne({userId: userId});
    if (!history) {
        history = new ActionHistory({
            userId: userId,
            logs: []
        });
        history = await history.save();
    }

    history.logs.push({
        name: browserInfo.name,
        version: browserInfo.version,
        os: browserInfo.os,
        ip: browserInfo.ip,
        action: action,
        timestamp: Date.now()
    });
    await history.save();
};
