'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');



let loadAccount = function (filename) {

      const accounts = JSON.parse(fs.readFileSync(filename));
      //console.log(accounts);
      db.prepare('DROP TABLE IF EXISTS user').run();
      console.log('Account table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY,' +
            'username TEXT, userLastName TEXT, email TEXT, password TEXT, adress TEXT, city TEXT,zipCode TEXT, phone TEXT, profilePicture TEXT)').run();



      let insertAccount = db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      let transaction = db.transaction((accounts) => {

            for (let i = 0; i < accounts.length; i++) {
                  let account = accounts[i];
                  insertAccount.run(account.id, account.username, account.userLastName, account.email, account.password, account.adress, account.city, account.zipCode, account.phone, account.profilePicture);
            }
      });

      transaction(accounts);
}

loadAccount('json/accounts.json');
//CREATE

exports.test = function () {
}

exports.create = function (id, email, username, userLastName, password) {
      console.log(username, email);

      let newAccount = {
            "id": id,
            "username": username,
            "userLastName": userLastName,
            "email": email,
            "password": password,
            "adress": "",
            "city": "",
            "zipCode": "",
            "phone": "",
            "profilePicture": "defaultAccountIco.png"

      };

      let accountsList = JSON.parse(fs.readFileSync('json/accounts.json'));
      accountsList.push(newAccount);

      fs.writeFileSync('json/accounts.json', JSON.stringify(accountsList, null, 2), function (err) {
            if (err) throw err;
            console.log(err);
      });
      try {
            db.prepare('INSERT INTO user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, username, userLastName, email, password, "", "", "", "", "defaultAccountIco.png");
      } catch (err) {
            console.log(err);
      }
      console.log('Account created');

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


exports.list = function () {
      return db.prepare('SELECT * FROM user').all();
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

}

exports.updateAccountPassword = function (password, email) {
      db.prepare('UPDATE user SET password = ? WHERE email = ?').run(password, email);
      console.log('Password updated');
}


//DELETE
exports.delete = function (email) {
      db.prepare('DELETE FROM user WHERE email = ?').run(email);
}


