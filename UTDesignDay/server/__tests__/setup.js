// this file is meant for the in-memory database for testing purposes.
// This file sets up an in-memory MongoDB database for testing purposes using MongoMemoryServer.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);

});

// beforeEach(async () => {
//   // clear all collections before each test
//   const collections = await mongoose.connection.db.collections();
//   for (let collection of collections) {
//     await collection.deleteMany({});
//   }
// });

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
