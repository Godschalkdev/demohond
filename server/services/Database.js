var firebase = require('firebase-admin');
var accountancyServiceaccount = ('./serviceAccount.json');
var worktimeServiceAccount = ('./worktimeServiceAccount.json');

var mongojs = require('mongojs');


class Database {
  constructor(databaseType, databaseName) {
    this.db1 = mongojs(databaseName);
    this.db2 = this.getFireBaseDb(databaseName);
    this.databaseType = databaseType;
  };

  getFireBaseDb(databaseName) {

    if (databaseName === 'worktime') {
      var worktime = firebase.initializeApp({
        credential: firebase.credential.cert(worktimeServiceAccount),

      }, 'worktime');
      return worktime.firestore();
    } else if (databaseName === 'accountancy') {
      var accountancy = firebase.initializeApp({
        credential: firebase.credential.cert(accountancyServiceaccount),

      }, "accountancy");
      return accountancy.firestore();
    } else if (databaseName === 'gamelog') {
      var gamelog = firebase.initializeApp({
        credential: firebase.credential.cert(worktimeServiceAccount),

      }, "gamelog");
      return gamelog.firestore();
    } else if (databaseName === 'bol') {
      var bol = firebase.initializeApp({
        credential: firebase.credential.cert(worktimeServiceAccount),

      }, "bol");
      return bol.firestore();
    }
    else return null;
  };

  insert(collection, data, callback) {
    if (this.databaseType === "firebase") {
      this.db2.collection(collection).doc().set(data);
    } else if (this.databaseType === "mongodb") {
      this.db1.collection(collection).insert(data, callback);
    }
  };

  // parseDocName(data){
  //   var docName = '';
  //   for(var key in data) {
  //     if(data.hasOwnProperty(key)) {
  //       docName += data[key];
  //       console.log(string);
  //     }
  //   }
  //
  //   return docName;
  // }

  delete(collection, query, callback) {
    if (this.databaseType === "firebase") {
      this.getFilteredFBDCollection(this.db2, collection, query).get().then(snapshot => {
        snapshot.forEach(docs => {
          docs.ref.delete();
        });
      });
    } else if (this.databaseType === "mongodb") {
      this.db1.collection(collection).remove(this.parseFilterDataToObject(query), true, callback);
    }
  }

  deleteOne(collection, query, callback) {
    if (this.databaseType === "firebase") {
      this.getFilteredFBDCollection(this.db2, collection, query).get().then(snapshot => {
        var isDeleted = false;
        snapshot.forEach(docs => {
          if (!isDeleted) {
            docs.ref.delete();
            isDeleted = true;
          }
        });
      });
    } else if (this.databaseType === "mongodb") {
      this.db1.collection(collection).remove(this.parseFilterDataToObject(query), true, callback);
    }
  }

// OM NIET TE VERGETEN !! CALLBACK FUNCTIE. JE GEEFT EEN CALLBACK FUNCTIE  MEE ALS PARAMETER OM TE ZEGGEN WANNEER DE FUNCTIE UITGEVOERD MOET WORDEN, ZOALS HIERONDER, ALS DE GEGEVENS ZIJN OMGEHAALD EN IN EEN ARRAY VAN OBJECTEN ZIJN GEPLAATST, VOER DAN CALLBACK UIT MET HET ARRAY OBJECT.
  get(collection, query, callback) {
    if (this.databaseType === "firebase") {
      var obj = [];
      this.getFilteredFBDCollection(this.db2, collection, query).get().then(snapshot => {
        if (snapshot) {
          snapshot.forEach(docs => {
            obj[obj.length] = docs.data()
          });
          callback(null, obj);
        }else {
          console.log("get request found nothing")
        }
      });
    } else if (this.databaseType === "mongodb") {
      this.db1.collection(collection).find(this.parseFilterDataToObject(query), {_id: 0}, callback);
    }
  };

  getAll(collection, callback) {
    if (this.databaseType === "firebase") {
      var obj = [];
      this.db2.collection(collection).get().then(snapshot => {
        snapshot.forEach(docs => {
          obj[obj.length] = docs.data()
        });
        callback(null, obj);
      });

    } else if (this.databaseType === "mongodb") {
      this.db1.collection(collection).find({}, {_id: 0}, callback);
    }
  }

  getOne(collection, query, callback) {
    if (this.databaseType === "firebase") {
      var obj = [];
      this.getFilteredFBDCollection(this.db2, collection, query).get().then(snapshot => {
        snapshot.forEach(docs => {
          obj[obj.length] = docs.data();
        });
        callback(null, obj);
      });
    } else if (this.databaseType === "mongodb") {

      this.db1.collection(collection).findOne(query, callback);
    }
  };


  update(collection, query, data, callback) {
    if (this.databaseType === "firebase") {
      this.getFilteredFBDCollection(this.db2, collection, query).get().then(snapshot => {
          snapshot.forEach(docs => {
            docs.ref.update(data);
          });
          // callback("data");
        }
      );
    } else if (this.databaseType === "mongodb") {


      this.db1.collection(collection).update(this.parseFilterDataToObject(query), {$set:data} , callback);
    }
  };


  getFilteredFBDCollection(fbd, collection, query) {
    var i;
    var col = fbd.collection(collection);
    for (i = 0; i < query.field_name.length; i++) {
      col = col.where(query.field_name[i], query.operator[i], query.value[i]);
    }
    return col;
  }


  parseFilterDataToObject(query) {
    var i;
    var object = {};

    if(query.field_name == null){
      console.log("invalid query object, query has no field_name");
    }else {
      for (i = 0; i < query.field_name.length; i++) {
        object[query.field_name[i]] = query.value[i];
      }
    }
    return object;
  }


}

module.exports = Database;
