const express = require('express');
const cors = require("cors")
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express()
// middleware

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.quaequt.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const appointmentOptionCollection = client.db('doctorsAppointment').collection("appointmentOptions")
        const bookingsCollection = client.db('doctorsAppointment').collection("bookings")
        
        app.get("/appointmentOptions",async(req,res)=>{
            const query = {}
            const options =  await appointmentOptionCollection.find(query).toArray()
            res.send(options)
        })

        app.post("/bookings",async(req,res)=>{
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })
    }
    finally{

    }
}

run().catch(console.log)


app.get("/",(req,res) =>{
    res.send("doctors portal server port is running on!")
})

app.listen(port,()=>console.log(`doctors portal running on port: ${port}`));
