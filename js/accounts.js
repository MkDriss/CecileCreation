'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadAccount = function (filename) {

      const accounts = JSON.parse(fs.readFileSync(filename));
      //console.log(accounts);
      db.prepare('DROP TABLE IF EXISTS user').run();
      console.log('Account table dropped');
      db.prepare('DROP TABLE IF EXISTS admin').run();
      console.log('Admin table dropped');
      db.prepare('DROP TABLE IF EXISTS favorites').run();
      console.log('Favorites table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY,' +
            'username TEXT, userLastName TEXT, email TEXT, password TEXT, adress TEXT, city TEXT,zipCode TEXT, phone TEXT, profilePicture TEXT)').run();
      db.prepare('CREATE TABLE IF NOT EXISTS admin (id TEXT PRIMARY KEY)').run();
      db.prepare('CREATE TABLE IF NOT EXISTS favorites (userId TEXT, productId TEXT)').run();

      let insertAccount = db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      let insertFavorite = db.prepare('INSERT INTO favorites VALUES (?, ?)');
      let transaction = db.transaction((accounts) => {
            for (let i = 0; i < accounts.length; i++) {
                  let account = accounts[i];
                  insertAccount.run(account.id, account.username, account.userLastName, account.email, account.password, account.adress, account.city, account.zipCode, account.phone, account.profilePicture);
                  if (account.favorite.length > 0) {
                        for (let j = 0; j < account.favorite.length; j++) {
                              insertFavorite.run(account.id, account.favorite[j]);
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
            "adress": "",
            "city": "",
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
            db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, username, "", email, password, "", "", "", "", "defaultAccountIco.png");
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

exports.getFavorites = function (id) {
      return db.prepare('SELECT productId FROM favorites WHERE userId = ?').all(id);
}


exports.list = function () {
      return db.prepare('SELECT * FROM user').all();
}

// SET

exports.setAdmin = function (id) {
      db.prepare('INSERT INTO admin VALUES (?)').run(id);
}

// ADD

exports.addToFavorite = function (userId, productId) {
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        if (!account.favorite.includes(productId)){ 
                              console.log("bonjour")
                              account.favorite.push(productId); 
                        }
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('INSERT INTO favorites VALUES (?, ?)').run(userId, productId);
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

exports.checkAdmin = function (id) {
      let admins = JSON.parse(fs.readFileSync('json/admin.json'));

      for (let i = 0; i < admins.length; i++) {
            let adminsId = admins[i].id;
            if (adminsId == id) {
                  return true;
            }
      }
      return false;
}

//UPDATE

exports.updateAccount = function (id, username, userLastName, email, adress, city, zipCode, phone, pictureName) {

      if (this.checkAdmin(id)) {
            fs.readFile('json/admin.json', function (err, data) {
                  if (err) throw err;
                  let adminsList = JSON.parse(data);
                  for (let i = 0; i < adminsList.length; i++) {
                        let admin = adminsList[i];
                        if (admin.id == id) {
                              admin.username = username;
                              admin.userLastName = userLastName;
                              admin.email = email;
                              admin.adress = adress;
                              admin.city = city;
                              admin.zipCode = zipCode;
                              admin.phone = phone;
                              admin.profilePicture = pictureName;
                        }
                  }
                  fs.writeFileSync('json/admin.json', JSON.stringify(adminsList, null, 2), function (err) {
                        if (err) throw err;
                        console.log(err);
                  });
            });
      }

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

exports.removeFavorite = function (userId, productId) {
      fs.readFile('json/accounts.json', function (err, data) {
            if (err) throw err;
            let accountsList = JSON.parse(data);
            for (let i = 0; i < accountsList.length; i++) {
                  let account = accountsList[i];
                  if (account.id === userId) {
                        let index = account.favorite.indexOf(productId);
                        if (index > -1) {
                              account.favorite.splice(index, 1);
                        }
                  }
            }
            fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('DELETE FROM favorites WHERE userId = ? AND productId = ?').run(userId, productId);
}


