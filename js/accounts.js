'use strict';

const Sqlite = require('better-sqlite3');
const exp = require('constants');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadAccount = function (filename) {

      const accounts = JSON.parse(fs.readFileSync(filename));
      //console.log(accounts);
      db.prepare('DROP TABLE IF EXISTS user').run();
      console.log('Account table dropped');
      db.prepare('DROP TABLE IF EXISTS admin').run();
      console.log('Admin table dropped');
      db.prepare('DROP TABLE IF EXISTS wishlist').run();
      console.log('wishlist table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY,' +
            'username TEXT, userLastName TEXT, email TEXT, password TEXT, admin INT, adress TEXT, city TEXT, zipCode TEXT, phone TEXT, profilePicture TEXT)').run();
      db.prepare('CREATE TABLE IF NOT EXISTS wishlist (userId TEXT, productId TEXT)').run();

      let insertAccount = db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      let insertWishlist = db.prepare('INSERT INTO wishlist VALUES (?, ?)');
      let transaction = db.transaction((accounts) => {
            for (let i = 0; i < accounts.length; i++) {
                  let account = accounts[i];
                  insertAccount.run(account.id, account.username, account.userLastName, account.email, account.password, account.admin, account.adress, account.city, account.zipCode, account.phone, account.profilePicture);
                  if (account.wishlist.length > 0) {
                        for (let j = 0; j < account.wishlist.length; j++) {
                              insertWishlist.run(account.id, account.wishlist[j]);
                        }
                  }
            }
      });

      transaction(accounts);
}

loadAccount('json/accounts.json');

//CREATE

exports.create = function (id, email, username, password) {
      let newAccount = {
            "id": id,
            "username": username,
            "userLastName": "",
            "email": email,
            "password": password,
            "admin": "0",
            "adress": "",
            "city": "",
            "wishlist": [],
            "zipCode": "",
            "phone": "",
            "profilePicture": "defaultAccountIco.png"

      };

      fs.readFile('./json/accounts.json', (err, data) => {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            accountsList.push(newAccount);
            fs.writeFile('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) console.log(err);
            });
      });
      try {
            db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, username, "", email, password, 0, "", "", "", "", "defaultAccountIco.png");
            console.log('Account created');
      } catch (err) {
            console.log(err);
      }
};

//READ 

exports.read = function (id) {
      return db.prepare('SELECT * FROM user WHERE id = ?').get(id);
}


//GET

exports.getPasswordFromId = function (id) {
      return db.prepare('SELECT password FROM user WHERE id = ?').get(id).password;
}

exports.getIdFromEmail = function (email) {
      return db.prepare('SELECT id FROM user WHERE email = ?').get(email);
}

exports.getWishlist = function (id) {
      return db.prepare('SELECT productId FROM wishlist WHERE userId = ?').all(id);
}


exports.list = function () {
      return db.prepare('SELECT * FROM user').all();
}

// SET

exports.setAdmin = function (id) {
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        account.admin = 1;
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('UPDATE user SET admin = 1 WHERE id = ?').run(id);
}

// ADD

exports.addToWishlist = function (userId, productId) {
      if (userId == undefined || productId == undefined) {
            return;
      }
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        if (!account.wishlist.includes(productId)) {
                              db.prepare('INSERT INTO wishlist VALUES (?, ?)').run(userId, productId);
                              account.wishlist.push(productId);
                        }
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });

}

//CHECK 

exports.checkEmail = function (email) {
      if (db.prepare('SELECT * FROM user WHERE email = ?').get(email) == undefined) {
            return 'false';
      }
      return 'true';
};

exports.checkPassword = function (email, password) {
      if (db.prepare('SELECT * FROM user WHERE email = ?').get(email) == undefined) {
            console.log('email not found');
            return 'false';
      }
      let pass = db.prepare('SELECT password FROM user WHERE email = ?').get(email).password;
      if (pass == password) {
            return 'true';
      }
      return 'false';
}

exports.isInWishlist = function (userId, productId) {
      if (userId == undefined || productId == undefined) {
            return false;
      }
      if (db.prepare('SELECT * FROM wishlist WHERE userId = ? AND productId = ?').get(userId, productId) == undefined) {

            return false;
      }

      return true;
}

//UPDATE

exports.updateAccount = function (id, username, userLastName, email, adress, city, zipCode, phone, pictureName) {

      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === id) {
                        account.username = username;
                        account.userLastName = userLastName;
                        account.email = email;
                        account.adress = adress;
                        account.city = city;
                        account.zipCode = zipCode;
                        account.phone = phone;
                        account.profilePicture = pictureName;
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });

      db.prepare('UPDATE user SET username = ?, userLastName = ?, email = ?, adress = ?, city = ?, zipCode = ?, phone = ?, profilePicture = ? WHERE id = ?').run(username, userLastName, email, adress, city, zipCode, phone, pictureName, id);
      console.log("Account updated");
}

exports.updateAccountPassword = function (password, email) {
      db.prepare('UPDATE user SET password = ? WHERE email = ?').run(password, email);
      console.log('Password updated');
}


//DELETE & REMOVE

exports.delete = function (email) {
      db.prepare('DELETE FROM user WHERE email = ?').run(email);
}

exports.removeFromWishlist = function (userId, productId) {
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        let index = account.wishlist.indexOf(productId);
                        if (index > -1) {
                              account.wishlist.splice(index, 1);
                        }
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('DELETE FROM wishlist WHERE userId = ? AND productId = ?').run(userId, productId);
}


