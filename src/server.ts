import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes"
import chatRoutes from "./routes/chatRoutes"
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes)
app.use("/api/chat", chatRoutes)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express & TypeScript Server!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger is running on http://localhost:${PORT}/api-docs`);
});
