const mongoose = require("mongoose")

const connectToDb = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/testdb");
        console.log("Connected to db")
    } catch (error) {
        console.log("Error Connecting to db", error)
    }
}
module.exports =  connectToDb;