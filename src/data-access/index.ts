import DBConnection from "./DBConnection";
import fs from "fs";

const db: any = {
  connection: DBConnection.getInstance(),
};

// create virtual models
fs.readdirSync("src/data-access/models/").forEach((file: any) => {
  import(`./models/${file}`).then((instance) => {
    const model = instance.default(db.connection);
    const modelName = file.split("Model")[0];
    db[modelName] = model;
  });
});

// create associations between models for ORM use
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;