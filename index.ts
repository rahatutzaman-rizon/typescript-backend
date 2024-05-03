import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import * as mongodb from 'mongodb';
import Joi from 'joi';

const app = express();
app.use(express.json());

const uri="mongodb+srv://redwantamim525:*****@cluster0.jkkcmls.mongodb.net/?retryWrites=true&w=majority";

const client = new mongodb.MongoClient(uri);
let collections: { users?: mongodb.Collection } = {};

async function connectToDatabase() {
  try {
    await client.connect();
    const db = client.db('your-database-name');
    const usersCollection = db.collection('users');
    collections.users = usersCollection;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
}

connectToDatabase();

interface IUser {
  _id?: ObjectId;
  uid: string;
  email: string;
  role: TRole;
  status: 'in-progress' | 'approved' | 'suspended';
  name: { firstName: string; lastName: string };
  phone: string;
  occupation?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'prefer-not-answer';
  photoUrl?: string;
  addresses?: {
    isDeleted: boolean;
    address: {
      street: string;
      city: string;
      prefecture: string;
      postalCode: string;
      country: string;
      buildingName: string;
      roomNumber: string;
      state?: string;
      details?: string;
    };
  }[];
}

type TRole =
  | 'showaUser'
  | 'showaAdmin'
  | 'showaSubAdmin'
  | 'serviceProviderAdmin'
  | 'serviceProviderSubAdmin'
  | 'serviceProviderEngineer'
  | 'serviceProviderBranchManager'
  | 'serviceProviderSupportStuff';

const validateUser = (user: any) => {
  const schema = Joi.object({
    uid: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('showaUser', 'showaAdmin', 'showaSubAdmin', 'serviceProviderAdmin', 'serviceProviderSubAdmin', 'serviceProviderEngineer', 'serviceProviderBranchManager', 'serviceProviderSupportStuff').required(),
    status: Joi.string().valid('in-progress', 'approved', 'suspended').required(),
    name: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
    }).required(),
    phone: Joi.string().required(),
    occupation: Joi.string(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('male', 'female', 'prefer-not-answer').required(),
    photoUrl: Joi.string(),
    addresses: Joi.array().items(
      Joi.object({
        isDeleted: Joi.boolean().required(),
        address: Joi.object({
          street: Joi.string().required(),
          city: Joi.string().required(),
          prefecture: Joi.string().required(),
          postalCode: Joi.string().required(),
          country: Joi.string().required(),
          buildingName: Joi.string().required(),
          roomNumber: Joi.string().required(),
          state: Joi.string(),
          details: Joi.string(),
        }).required(),
      })
    ),
  });

  return schema.validate(user);
};

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const result = await collections.users?.insertOne(req.body);
    res.send(result);
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
});

app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.query;
    const query: any = {};

    if (email) {
      query.email = { $regex: new RegExp(email as string, 'i') };
    }

    if (phone) {
      query.phone = { $regex: new RegExp(phone as string, 'i') };
    }

    const users = await collections.users?.find(query).toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));