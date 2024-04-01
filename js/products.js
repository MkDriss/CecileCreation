'use strict';

const Sqlite = require('better-sqlite3');
const fs = require('fs');
let db = new Sqlite('db.sqlite');

let loadProduct = function (filename) {

      const products = JSON.parse(fs.readFileSync(filename));

      db.prepare('DROP TABLE IF EXISTS products').run();
      console.log('products table dropped');
      db.prepare('DROP Table IF EXISTS pictures').run();
      console.log('pictures table dropped');
      db.prepare('CREATE TABLE IF NOT EXISTS products (productId TEXT PRIMARY KEY, productName TEXT, productCategory TEXT,productPrice INTEGER, productHeight INTEGER, productWidth INTEGER, productDepth INTEGER, productMaterial TEXT, productDescription TEXT)').run();
      db.prepare('CREATE TABLE IF NOT EXISTS pictures (productId TEXT, pictureName TEXT, pictureId INTEGER )').run();
      let insertProductPicture = db.prepare('INSERT INTO pictures VALUES (?, ?, ?)');
      let insertProduct = db.prepare('INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

      let transaction = db.transaction((products) => {

            for (let tempProduct = 0; tempProduct < products.length; tempProduct++) {
                  let product = products[tempProduct];
                  insertProduct.run(product.productId, product.productName, product.productCategory, product.productPrice, product.productHeight, product.productWidth, product.productDepth, product.productMaterial, product.productDescription);
                  let productPictures = product.productPicture;
                  for (let i = 0; i < productPictures.length; i++) {
                        let picture = productPictures[i];
                        insertProductPicture.run(product.productId, picture.pictureName, picture.pictureId);
                  }
            }
      });

      transaction(products);
}

loadProduct('./json/products.json');

// CREATE

exports.create = function (productId, productName, productCategory = "None", productHeight, productWidth, productDepth, productMaterial = "None", productPrice, productDescription, pictureData) {
      let pictures = [];
      for (let i = 0; i < pictureData.length; i++) {
            pictures.push({ "pictureName": productName + "_" + i + "_" + productId + ".png", "pictureId": i });
      }
      let newProduct = {
            "productId": productId,
            "productName": productName,
            "productCategory": productCategory,
            "productPrice": productPrice,
            "productHeight": productHeight,
            "productWidth": productWidth,
            "productDepth": productDepth,
            "productMaterial": productMaterial,
            "productDescription": productDescription,
            "productPicture": pictures,
      };
      try {
            db.prepare('INSERT INTO products(productId, productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(productId, productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription);
            for (let i = 0; i < pictures.length; i++) {
                  db.prepare('INSERT INTO pictures(productId, pictureName, pictureId) VALUES (?, ?, ?)').run(productId, pictures[i].pictureName, i);
            }
            fs.readFile('./json/products.json', (err, data) => {
                  if (err) throw err;
                  let productList = JSON.parse(data);
                  productList.push(newProduct);
                  fs.writeFile('json/products.json', JSON.stringify(productList, null, 2), function (err) {
                        if (err) console.log(err);
                        console.log('product Added!');
                  });
            });
      } catch (err) {
            console.log(err);
      }
}

// READ

exports.read = function (productId) {
      return db.prepare('SELECT * FROM products WHERE productId = ?').get(productId);
}

// GET

exports.getProductPictures = function (productId) {
      return db.prepare('SELECT * FROM pictures WHERE productId = ?').all(productId);
}

exports.getProductFromCategory = function (category) {
      return db.prepare('SELECT * FROM products WHERE productCategory = ?').all(category);
}

exports.getCategories = function () {
      let categories = db.prepare('SELECT DISTINCT productCategory FROM products').all();
      for (let i = 0; i < categories.length; i++) {
            let category = categories[i];
            if (category.productCategory === "None") {
                  categories.splice(i, 1);
            }
      }
      return categories;
}

exports.getMaterials = function () {
      let materials = db.prepare('SELECT DISTINCT productMaterial FROM products').all();
      for (let i = 0; i < materials.length; i++) {
            let material = materials[i];
            if (material.productMaterial === "None") {
                  materials.splice(i, 1);
                  break;
            }
      }
      return materials;
}


// UPDATE

exports.update = function (productId, productName, productCategory = "None", productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription, pictureData) {
      let pictures;
      if (pictureData.length === 0) {
            pictures = db.prepare('SELECT pictureName, pictureId FROM pictures WHERE productId = ?').all(productId);
            for (let i = 0; i < pictures.length; i++) {
                  pictures[i].pictureId = i;
            }
      } else {
            let currentPictures = db.prepare('SELECT pictureName FROM pictures WHERE productId = ?').all(productId);
            for (let i = 0; i < currentPictures.length; i++) {
                  fs.unlinkSync('public/products_pictures/' + currentPictures[i].pictureName);
                  console.log('picture ' + currentPictures[i].pictureName + ' deleted');
            }
            db.prepare('DELETE FROM pictures WHERE productId = ?').run(productId);
            pictures = [];
            for (let i = 0; i < pictureData.length; i++) {
                  let pictureName = productName + "_" + i + "_" + productId + ".png";
                  pictures.push({ "pictureName": pictureName, "pictureId": i });
                  db.prepare('INSERT INTO pictures(productId, pictureName, pictureId) VALUES (?, ?, ?)').run(productId, pictureName, i);
            }
            
      }

      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for (let i = 0; i < productsList.length; i++) {
                  let product = productsList[i];
                  if (product.productId === productId) {
                        product.productName = productName;
                        product.productCategory = productCategory;
                        product.productPrice = productPrice;
                        product.productDescription = productDescription;
                        product.productHeight = productHeight;
                        product.productWidth = productWidth;
                        product.productDepth = productDepth;
                        product.productMaterial = productMaterial;
                        product.productPicture = pictures;
                  }
            }
            fs.writeFileSync('json/products.json', JSON.stringify(productsList, null, 2), function (err) {
                  if (err) throw err;
                  console.log(err);
            });
      });
      db.prepare('UPDATE products SET productName = ?, productCategory = ?, productPrice = ?, productHeight = ?, productWidth = ?, productDepth = ?, productMaterial = ?, productDescription = ? WHERE productId = ?').run(productName, productCategory, productPrice, productHeight, productWidth, productDepth, productMaterial, productDescription, productId);
}

// LIST

exports.list = function () {
      let productslist = db.prepare('SELECT * FROM products').all();
      for (let i = 0; i < productslist.length; i++) {
            let product = productslist[i];
            product.productPicture = (db.prepare('SELECT pictureName FROM pictures WHERE productId = ?').all(product.productId))[0].pictureName;
      }
      return productslist;
}


// DELETE

exports.delete = function (productId) {
      let currentPictures = db.prepare('SELECT pictureName FROM pictures WHERE productId = ?').all(productId);
      for (let i = 0; i < currentPictures.length; i++) {
            fs.unlinkSync('public/products_pictures/' + currentPictures[i].pictureName);
      }
      fs.readFile('json/products.json', function (err, data) {
            if (err) throw err;
            let productsList = JSON.parse(data);
            for (let i = 0; i < productsList.length; i++) {
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