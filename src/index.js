import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((err) => console.log("UNABLE TO CONNECT TO DB: " + err));
