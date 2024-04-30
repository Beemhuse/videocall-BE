const app = require ('./server').app;
const jwt = require('jsonwebtoken');
const linkSecret = "jasowepiohiasodnc;dhioweuryui1212%456542#329)9wed"
const { v4: uuidv4 } = require('uuid')

const professionalAppointments = []
app.set('professionalAppointments',professionalAppointments )


app.get('/user-link', (req, res)=>{
    const uuid = uuidv4() // this is a unique id or primary key
    console.log(uuid)

    // data for the end-user's appointment
    const apptData = {
        professionalsFullName: "Bright, A.B.",
        apptDate: Date.now(),
        uuid
    }

    professionalAppointments.push(apptData)
    const token = jwt.sign(apptData, linkSecret)
    res.send('https://localhost:5173/join-video?token='+token)
    // res.json("This is a test route")
})

app.post('/validate-link', (req, res) => {
    console.log("Received request with body:", req.body);
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        const decodedData = jwt.verify(token, linkSecret);
        res.json(decodedData);
    } catch (error) {
        console.error('Error verifying JWT:', error);
        res.status(401).json({ error: 'Invalid token' });
    }

    console.log(professionalAppointments)
});
