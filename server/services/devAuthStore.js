import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, '..', 'data', 'dev-users.json');

async function readUsers() {
  try {
    const data = await fs.readFile(storePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeUsers(users) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(users, null, 2));
}

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function createDevUser(userData) {
  const users = await readUsers();
  const email = userData.email.toLowerCase();

  if (users.some((user) => user.email === email)) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  const user = {
    id: randomUUID(),
    name: userData.name,
    email,
    phone: userData.phone,
    password: await bcrypt.hash(userData.password, 10),
    bloodGroup: userData.bloodGroup || 'Unknown',
    medicalConditions: userData.medicalConditions || [],
    allergies: userData.allergies || [],
    emergencyContacts: [],
    location: {
      type: 'Point',
      coordinates: [0, 0],
    },
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  return publicUser(user);
}

export async function findDevUserByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email.toLowerCase()) || null;
}

export async function findDevUserById(id) {
  const users = await readUsers();
  const user = users.find((item) => item.id === id);
  return user ? publicUser(user) : null;
}

export async function verifyDevUser(email, password) {
  const user = await findDevUserByEmail(email);

  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  return isMatch ? publicUser(user) : null;
}

export async function updateDevUser(id, updates) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    return null;
  }

  users[index] = {
    ...users[index],
    ...updates,
    id: users[index].id,
    email: users[index].email,
    password: users[index].password,
  };

  await writeUsers(users);
  return publicUser(users[index]);
}
