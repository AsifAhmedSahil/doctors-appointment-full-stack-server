const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");

const app = express();
// middleware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.quaequt.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
  try {
    const appointmentOptionCollection = client
      .db("doctorsAppointment")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorsAppointment")
      .collection("bookings");
    const usersCollection = client.db("doctorsAppointment").collection("users");

    // this is for overall data load
    // app.get("/appointmentOptions",async(req,res)=>{
    //     const query = {}
    //     const options =  await appointmentOptionCollection.find(query).toArray()
    //     res.send(options)
    // })

    // overall data load plus find appointment date & time slot****
    // mane perticular date e kon kon time slot booked kar kar jonno aita nilam 1st

    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;

      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedslots = optionBooked.map((book) => book.slot);
        // remainining slots gulo k alada krbo

        const remainingSlots = option.slots.filter(
          (slot) => !bookedslots.includes(slot)
        );
        option.slots = remainingSlots;
        console.log(date, option.name, bookedslots);
      });
      res.send(options);
    });


    app.get("/users",async(req,res)=>{
      const query = {}
      const users = await usersCollection.find(query).toArray()
      res.send(users);
    })

    app.put("/users/admin/:id",verifyJWT,async(req,res)=>{

      // user admin naki check krar jonno aita krte hoi token er sathe milate hoi
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail}
      const user = await usersCollection.findOne(query);

      if(user?.role !== "admin"){
        return res.status(403).send({message: "forbidden access"})
      }


      const id = req.params.id;
      const filter = { _id: ObjectId(id)}
      const options = { upsert: true};
      const updatedDoc= {
        $set:{
          role:"admin"
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc,options);
      res.send(result)
    })


    app.get('/bookings', verifyJWT, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if (email !== decodedEmail) {
            return res.status(403).send({ message: 'forbidden access' });
        }

        const query = { email: email };
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
    })

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        treatment: booking.treatment,
        email: booking.email,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledge: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // JWT token setup

    app.get('/jwt', async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (user) {
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            return res.send({ accessToken: token });
        }
        res.status(403).send({ accessToken: '' })
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.log);

app.get("/", (req, res) => {
  res.send("doctors portal server port is running on!");
});

app.listen(port, () => console.log(`doctors portal running on port: ${port}`));
