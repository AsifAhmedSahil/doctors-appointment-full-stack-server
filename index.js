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
        
        // this is for overall data load 
        // app.get("/appointmentOptions",async(req,res)=>{
        //     const query = {}
        //     const options =  await appointmentOptionCollection.find(query).toArray()
        //     res.send(options)
        // })


        // overall data load plus find appointment date & time slot****
        // mane perticular date e kon kon time slot booked kar kar jonno aita nilam 1st

        app.get("/appointmentOptions",async(req,res)=>{
            const date = req.query.date;
            
            const query = {}
            const options =  await appointmentOptionCollection.find(query).toArray()
            const bookingQuery = {appointmentDate:date}
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedslots = optionBooked.map(book => book.slot)
                // remainining slots gulo k alada krbo

                const remainingSlots = option.slots.filter(slot => !bookedslots.includes(slot))
                option.slots = remainingSlots
                console.log(date,option.name,bookedslots);
            })
            res.send(options)
        })

        app.post("/bookings",async(req,res)=>{
            const booking = req.body;
            const query = {
                appointmentDate:booking.appointmentDate,
                treatment: booking.treatment,
                email: booking.email
            }


            const alreadyBooked = await bookingsCollection
            .find(query).toArray();

            if(alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({acknowledge:false , message})
            }



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
