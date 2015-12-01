// load the things we need
var bcrypt   = require('bcrypt-nodejs');

var records = {};
var _id = 0;

var User = function() {

    var _this = this;
    this._id = _id++;
    this.auth = {};

    this.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    this.validPassword = function(password) {
        return bcrypt.compareSync(password, _this.auth.local.password);
    };

    this.save = function(cb) {
        records[_this._id] = (this);
        if(typeof cb === 'function') {
            cb();
        }
    };

};

User.findById = function(id, cb) {
    process.nextTick(function() {
        if (records[id]) {
            cb(null, records[id]);
        } else {
            cb(new Error('User ' + id + ' does not exist'));
        }
    });
};

User.findByUsername = function(username, cb) {
    process.nextTick(function() {
        for (var i = 0, len = records.length; i < len; i++) {
            var record = records[i];
            if (record.username === username) {
                return cb(null, record);
            }
        }
        return cb(null, null);
    });
};

User.findOne = function(criteria, cb) {
    var foundOne = Object.keys(records).filter(function(user) {
        var retVal = true;
        Object.keys(criteria).forEach(function (criteriaPath) {
            var criteriaKey = records[user];
            ('auth.' + criteriaPath).split('.').forEach(function (criteriaPathPart) {
                if(typeof criteriaKey !== 'undefined') {
                    criteriaKey = criteriaKey[criteriaPathPart];
                }
            });
            if(typeof criteriaKey !== 'undefined') {
                retVal = retVal && (criteriaKey == criteria[criteriaPath]);
            } else {
                retVal = false;
            }
        });
        return retVal;
    });

    if(foundOne.length > 1) {
        cb(foundOne.length + ' users found...', null);
    } else if(foundOne.length == 0) {
        cb(null, null);
    } else {
        cb(null, records[foundOne[0]]);
    }
};


// create the model for users and expose it to our app
module.exports = User;


var newUser = new User();
newUser.auth.local = {};
newUser.auth.local.email = 'lft@qlik.com';
newUser.auth.local.password = newUser.generateHash('test');
newUser.save();