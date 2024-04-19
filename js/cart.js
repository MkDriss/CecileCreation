'use strict';
const { get } = require('express/lib/response.js');
var shop = require('./shop.js');

const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');


db.prepare('DROP TABLE IF EXISTS cart').run();
console.log('Cart table dropped');
db.prepare('CREATE TABLE IF NOT EXISTS cart (id TEXT, productId TEXT PRIMARY KEY, quantity INT)').run();

// CREATE

exports.addProduct = function (id, productId, quantity = 1) {
      if (this.getQuantity(id, productId) < 1 || this.getQuantity(id, productId) == undefined){
            db.prepare('INSERT INTO cart (id, productId, quantity) VALUES (?, ?, ?)').run(id, productId, quantity);
      } else { 
            db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ? AND productId = ?').run(quantity, id, productId); 
      }

}

// GET

exports.getTotalPrice = function (id) {
      let totalPrice = 0;
      let productsList = db.prepare('SELECT productId, quantity FROM cart WHERE id = ?').all(id);
      for (let product of productsList) {
            totalPrice += shop.getProductPrice(product.productId) * product.quantity;
      }
      return totalPrice;
}

exports.getQuantity = function (id, productId) {
      let quantity = db.prepare('SELECT quantity FROM cart WHERE id = ? AND productId = ?').get(id, productId);
      if (quantity == undefined) {
            return 0;
      }
      return quantity.quantity;
}

// LIST

exports.listProducts = function (id) {
      return db.prepare('SELECT productId FROM cart WHERE id = ?').all(id);
}


exports.listAll = function () {
      return db.prepare('SELECT * FROM cart').all();
}

// UPDATE

exports.updateQuantity = function (id, productId, quantity) {
      db.prepare('UPDATE cart SET quantity = ? WHERE id = ? AND productId = ?').run(quantity, id, productId);
}

//REMOVE

exports.removeProduct = function (id, productId) {
      db.prepare('DELETE FROM cart WHERE productId = ? AND id = ?').run(productId, id);
}

exports.clearAll = function (id) {
      db.prepare('DELETE FROM cart WHERE id = ?').run(id);
}
