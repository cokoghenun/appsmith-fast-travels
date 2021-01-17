require('dotenv').config();
const faker = require('faker');
const placename = require('placename');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890', 8);
const MongoClient = require('mongodb').MongoClient;

const genID = () => {
  const tid = [...nanoid()];
  tid.splice(4, 0, '-');
  return tid.join('');
};

const locate = (location) => {
  return new Promise((resolve, reject) => {
    placename(location, function (error, data) {
      if (error) reject(error);
      resolve(data);
    });
  });
};

MongoClient.connect(process.env.DB_URL, async function (err, client) {
  const db = client.db('fast-travels');

  /**
   * SEED BUSSES
   */

  let busses = [];
  const bussCollection = db.collection('busses');

  for (let i = 0; i < 100; i += 1) {
    const seats = [5, 15, 20, 25, 30, 40, 50];
    const features = ['ac', 'leg-room', 'head-room'];
    const statuses = ['ontrip', 'inrepair', 'inpark'];
    const routes = [
      'jos - warri',
      'abuja - kano',
      'aba - onitsha',
      'lagos - abuja',
      'lokoja - yola',
      'calabar - lagos',
    ];
    const route = routes[Math.floor(Math.random() * routes.length)];
    const location = (await locate(route.split(' - ')[0]))[0];
    const { lat, lon } = location;

    let bus = {
      lat,
      lon,
      route,
      id: genID(),
      seats: seats[Math.floor(Math.random() * seats.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      feature: features[Math.floor(Math.random() * features.length)],
    };
    busses.push(bus);
  }
  bussCollection.insertMany(busses);

  /**
   * SEED TRIPS
   */

  let trips = [];
  const tripCollection = db.collection('trips');

  for (let i = 0; i < 50; i += 1) {
    const statuses = ['started', 'completed', 'pending'];
    const prices = ['$200', '$100', '$150', '$250', '$300'];

    let trip = {
      id: genID(),
      bus: busses[i].id,
      enddate: faker.date.future(),
      startdate: faker.date.past(),
      price: prices[Math.floor(Math.random() * prices.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
    trips.push(trip);
  }
  tripCollection.insertMany(trips);

  /**
   * SEED CUSTOMERS
   */

  let customers = [];
  const customerCollection = db.collection('customers');

  for (let i = 0; i < 500; i += 1) {
    const lastname = faker.name.lastName();
    const firstname = faker.name.firstName();

    let customer = {
      lastname,
      firstname,
      id: genID(),
      phone: faker.phone.phoneNumber(),
      password: faker.internet.password(),
      email: faker.internet.email(firstname, lastname),
      trip: trips[Math.floor((i / 500) * trips.length)].id,
    };
    customers.push(customer);
  }
  customerCollection.insertMany(customers);

  console.log('Database seeded! :)');
  client.close();
});
