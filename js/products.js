'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function(filename) {

      const products= JSON.parse(fs.readFileSync(filename));
      
      db.prepare ('DROP TABLE IF EXISTS products').run();
      console.log('products table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS products (productId TEXT PRIMARY KEY, productName TEXT, productCategory TEXT,productPrice INTEGER, productDescription TEXT, productPicture TEXT)').run();
      let insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)');

      let transaction = db.transaction((products) => {
                  
                  for(let tempProduct = 0;tempProduct < products.length; tempProduct++) {
                        let product = products[tempProduct];
                        insertProduct.run(product.productId, product.productName, product.productCategory, product.productPrice, product.productDescription, product.productPicture);
                  }     
            });

      transaction(products);
      }

loadProduct('./json/products.json');


exports.create = function (productId, productName, productCategory, productPrice, productDescription) {
      let pictureName = productName + '_' + productId + '.png';
      console.log(productName);

      let newProduct = {
            "productId": productId,
            "productName": productName,
            "productCategory": productCategory,
            "productPrice": productPrice,
            "productDescription": productDescription, 
            "productPicture": pictureName 
      };
      try{
            fs.readFile('./json/products.json', (err, data) => {
                  if (err) throw err;
                  let productList = JSON.parse(data);
                  productList.push(newProduct);
                  fs.writeFile('json/products.json', JSON.stringify(productList, null, 2), function (err) {
                        if (err) console.log(err);
                        console.log('product Added!');
                  });
            });
            db.prepare('INSERT INTO products(productId, productName, productPrice, productDescription, productPicture) VALUES (?, ?, ?, ?, ?)').run(productId, productName, productPrice, productDescription, pictureName);
      } catch(err) {
            console.log(err);
      }  
}

exports.read = function (productId) {
      return db.prepare('SELECT * FROM products WHERE productId = ?').get(productId);
}

exports.update = function (productId, productName, productCategory, productPrice, productDescription) {
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for(let i = 0;i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        product.productName = productName;
                        product.productCategory = productCategory;
                        product.productPrice = productPrice;
                        product.productDescription = productDescription;
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      
      db.prepare('UPDATE products SET productName = ?, productCategory = ?, productPrice = ?, productDescription = ? WHERE productId = ?').run(productName, productCategory, productPrice, productDescription, productId);

}

exports.delete = function (productId) {
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for(let i = 0;i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        productsList.splice(i, 1);
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('DELETE FROM products WHERE productId = ?').run(productId);
      console.log('product ' + productId + ' deleted');
}

exports.list = function () {
      return db.prepare('SELECT * FROM products').all();
}

exports.getProductFromCategory = function (category){
      return db.prepare('SELECT * FROM products WHERE productCategory = ?').all(category);
}

exports.getCategories = function () {
      let categories = db.prepare('SELECT DISTINCT productCategory FROM products').all();
      for (let i = 0; i < categories.length; i++) {
            categories[i] = categories[i].productCategory;
        }
      return categories;
}