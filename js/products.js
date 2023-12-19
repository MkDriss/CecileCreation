'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function(filename) {

      const products= JSON.parse(fs.readFileSync(filename));

      
      db.prepare ('DROP TABLE IF EXISTS product').run();
      console.log('product table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS product (productId TEXT PRIMARY KEY, name TEXT, price INTEGER, description TEXT, picture TEXT)').run();
      let insertProduct = db.prepare('INSERT INTO product VALUES (?, ?, ?, ?, ?)');

      let transaction = db.transaction((products) => {
                  
                  for(let tempProduct = 0;tempProduct < products.length; tempProduct++) {
                        let product = products[tempProduct];
                        //console.log(product);
                        insertProduct.run(product.productId, product.name, product.price, product.description, product.picture);
                  }     
            });

      transaction(products);
      }

loadProduct('./json/products.json');


exports.create = function (productId, name, price, description, picture) {
      let pictureName = name + '_' + productId + '.png';
      console.log(pictureName);

      db.prepare('INSERT INTO product (productId, name, price, description, picture) VALUES (?, ?, ?, ?, ?)').run(productId, name, price, description, pictureName);
      
      let newProduct = {
            "productId": productId,
            "name": name,
            "price": price,
            "description": description, 
            "picture": pictureName 
      };
            
      let productList = JSON.parse(fs.readFileSync('./json/products.json'));
      productList.push(newProduct);
      fs.writeFile('json/products.json', JSON.stringify(productList, null, 2), function (err) {
            if (err) console.log(err);
            console.log('product Added!');
      });
      
}

exports.read = function (productId) {
      return db.prepare('SELECT * FROM product WHERE productId = ?').get(productId);
}

exports.update = function (productId, name, price, description) {
      db.prepare('UPDATE product SET name = ?, price = ?, description = ? WHERE productId = ?').run(name, price, description, productId);
}

exports.delete = function (productId) {
      db.prepare('DELETE FROM product WHERE productId = ?').run(productId);
}

exports.list = function () {
      return db.prepare('SELECT * FROM product').all();
}


