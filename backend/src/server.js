const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

/*   <!-- AHMAD code  --> */


/*   <!-- END of AHMAD code  --> */

/*   <!-- RAGHAD  code  --> */


/*   <!-- END of RAGHAD code  --> */

/*   <!-- AMAAL code  --> */


/*   <!-- END of AMAAL code  --> */
app.get('/' , (req, res) => {
    res.send('Hello from the backend server!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
}); 