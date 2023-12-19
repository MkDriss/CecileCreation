'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

db.prepare('DROP TABLE IF EXISTS cart').run();
console.log('Cart table dropped');
db.prepare('CREATE TABLE IF NOT EXISTS cart (id TEXT, products TEXT)').run();

exports.addProduct = function (id, products){
      db.prepare('INSERT INTO cart (id, products) VALUES (?, ?)').run(id, products);

}

exports.listProducts = function (id) {
      return db.prepare('SELECT products FROM cart WHERE id = ?').all(id);
}

exports.removeProduct = function (id, products) {
      db.prepare('DELETE FROM cart WHERE products = ? AND id = ? LIMIT 1').run(products, id);
}

exports.getTotalPrice = function(id){
      let totalPrice = 0;
      let productsList = db.prepare('SELECT products FROM cart WHERE id = ?').all(id);
      for(let i = 0; i < productsList.length; i++){
            let product = JSON.parse(productsList[i].products);
            totalPrice += product.price;
      }
      return totalPrice;
}

exports.clearAll = function (id) {
      db.prepare('DELETE FROM cart WHERE id = ?').run(id);
}

exports.listAll = function () {
      return db.prepare('SELECT * FROM cart').all();
}